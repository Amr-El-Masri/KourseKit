package com.koursekit.service;

import com.koursekit.exception.ResourceNotFoundException;
import com.koursekit.model.*;
import com.koursekit.repository.StudyBlockRepository;
import com.koursekit.repository.StudyPlanRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudyPlanService {
    @Autowired
    private SchedulerService schedulerService;

    @Autowired
    private StudyPlanRepository entryRepository;

    @Autowired
    private StudyBlockRepository blockRepository;


    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public StudyPlanEntry createEntry(Long userId, Long taskId, double estimatedWorkload) {
        User user = entityManager.getReference(User.class, userId);
        Task task = entityManager.getReference(Task.class, taskId);

        StudyPlanEntry entry = new StudyPlanEntry();
        entry.setUser(user);
        entry.setTask(task);
        entry.setEstimatedWorkload(estimatedWorkload);
        entry.setCompletedHours(0);

        return entryRepository.save(entry);
    }

    @Transactional
    public Map<DayOfWeek, List<StudyBlock>> generatePlan(Long userId, SchedulerSettings settings) {
        List<StudyPlanEntry> entries = entryRepository.findByUserId(userId);

        SchedulerResult result = schedulerService.generatePlan(entries, settings, LocalDate.now());

        saveSchedule(entries, result.getBlocks());

        // Return weekly view starting from today
        return getWeeklyView(userId, LocalDate.now());
    }

    // Preserve Completed, Reschedule Rest
    @Transactional
    public Map<DayOfWeek, List<StudyBlock>> rebalance(Long userId, SchedulerSettings settings) {
        try {
            List<StudyPlanEntry> entries = entryRepository.findByUserId(userId);

            // Wipe only uncompleted blocks
            for (StudyPlanEntry entry : entries) {
                blockRepository.deleteByStudyPlanEntryAndCompletedFalse(entry);
            }

            entityManager.flush();

            for (StudyPlanEntry entry : entries) {
                entityManager.refresh(entry);
            }

            // Generate a fresh plan for remaining workload using new availability
            // generatePlan uses estimatedWorkload - completedHours so completed work is respected
            SchedulerResult result = schedulerService.generatePlan(entries, settings, LocalDate.now());
            saveSchedule(entries, result.getBlocks());

            return getWeeklyView(userId, LocalDate.now());

        } catch (Exception e) {
            System.err.println("REBALANCE ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @Transactional
    public void completeBlock(Long blockId) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Block not found"));

        // Mark as completed
        block.setCompleted(true);
        blockRepository.save(block);

        // Update entry's completed hours
        StudyPlanEntry entry = block.getStudyPlanEntry();
        entry.setCompletedHours(entry.getCompletedHours() + block.getDuration());
        entryRepository.save(entry);
    }


    // Marks a study block as uncompleted (undo).
    @Transactional
    public void uncompletedBlock(Long blockId) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Block not found"));

        if (!block.isCompleted()) {
            return; // Already uncompleted
        }

        // Mark as uncompleted
        block.setCompleted(false);
        blockRepository.save(block);

        // Update entry's completed hours
        StudyPlanEntry entry = block.getStudyPlanEntry();
        entry.setCompletedHours(Math.max(0, entry.getCompletedHours() - block.getDuration()));
        entryRepository.save(entry);
    }


    // Returns all study blocks for a given week, grouped by day.

    public Map<DayOfWeek, List<StudyBlock>> getWeeklyView(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(7);

        List<StudyBlock> blocks = blockRepository.findByStudyPlanEntry_User_IdAndDayBetween(
                userId,
                weekStart,
                weekEnd
        );

        // Group by day of week
        return blocks.stream()
                .collect(Collectors.groupingBy(
                        block -> block.getDay().getDayOfWeek(),
                        TreeMap::new,  // Keep days in order
                        Collectors.toList()
                ));
    }


    @Transactional
    public void deleteBlock(Long blockId) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("StudyBlock", blockId));

        if (block.isCompleted()) {
            // Reload the entry fresh within this transaction instead of using the proxy
            Long entryId = block.getStudyPlanEntry().getId();
            StudyPlanEntry entry = entryRepository.findById(entryId)
                    .orElseThrow(() -> new ResourceNotFoundException("StudyPlanEntry", entryId));
            entry.setCompletedHours(Math.max(0, entry.getCompletedHours() - block.getDuration()));
            entryRepository.save(entry);
        }

        blockRepository.delete(block);
    }

    @Transactional
    public void deleteEntry(Long entryId) {
        StudyPlanEntry entry = getEntry(entryId);

        blockRepository.deleteAll(
                blockRepository.findByStudyPlanEntry(entry)
        );

        entryRepository.delete(entry);
    }
    @Transactional
    public StudyPlanEntry updateEntry(Long entryId, StudyPlanEntry updates) {
        StudyPlanEntry existing = getEntry(entryId);

        if (updates.getTask() != null) {
            existing.setTask(updates.getTask());
        }
        if (updates.getEstimatedWorkload() > 0) {
            existing.setEstimatedWorkload(updates.getEstimatedWorkload());
        }
        return entryRepository.save(existing);
    }

    @Transactional
    public StudyBlock editBlock(Long blockId, Map<String, Object> updates) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("StudyBlock", blockId));

        if (updates.containsKey("startTime")) {
            block.setStartTime(java.time.LocalTime.parse((String) updates.get("startTime")));
        }

        if (updates.containsKey("duration")) {
            double newDuration = ((Number) updates.get("duration")).doubleValue();

            // If block was completed, adjust entry's completedHours for the duration change
            if (block.isCompleted()) {
                StudyPlanEntry entry = block.getStudyPlanEntry();
                double diff = newDuration - block.getDuration();
                entry.setCompletedHours(Math.max(0, entry.getCompletedHours() + diff));
                entryRepository.save(entry);
            }

            block.setDuration(newDuration);
        }

        return blockRepository.save(block);
    }


    private void saveSchedule(List<StudyPlanEntry> entries, List<StudyBlock> blocks) {
        blockRepository.saveAll(blocks);
    }

    public List<StudyPlanEntry> getActiveEntries(Long userId) {
        return entryRepository.findByUserId(userId);
    }


    public StudyPlanEntry getEntry(Long entryId) {
        return entryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
    }
}