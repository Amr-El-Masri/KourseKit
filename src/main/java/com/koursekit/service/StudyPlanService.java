package com.koursekit.service;
import com.koursekit.model.AvailabilitySlot;
import com.koursekit.repository.AvailabilitySlotRepository;

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

    @Autowired
    private AvailabilitySlotRepository slotRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public StudyPlanEntry createEntry(Long userId, Long taskId, double estimatedWorkload) {
        User user = entityManager.getReference(User.class, userId);
        Task task = entityManager.find(Task.class, taskId);
        if (task == null) throw new RuntimeException("Task not found: " + taskId);

        // Check for duplicate using direct query to avoid lazy loading issues
        boolean duplicate = entryRepository.existsByUserIdAndTaskId(userId, taskId);
        if (duplicate) throw new RuntimeException("Entry for this task already exists");

        StudyPlanEntry entry = new StudyPlanEntry();
        entry.setUser(user);
        entry.setTask(task);
        entry.setEstimatedWorkload(estimatedWorkload);
        entry.setCompletedHours(0);

        return entryRepository.save(entry);
    }

    @Transactional
    public SchedulerResult generatePlan(Long userId, SchedulerSettings settings) {
        List<StudyPlanEntry> entries = entryRepository.findByUserId(userId);

        for (StudyPlanEntry entry : entries) {
            blockRepository.deleteAll(blockRepository.findByStudyPlanEntry(entry));
        }
        entityManager.flush();
        for (StudyPlanEntry entry : entries) {
            entry.setCompletedHours(0);
            entryRepository.save(entry);
            entityManager.refresh(entry);
        }

        SchedulerResult result = schedulerService.generatePlan(entries, settings, LocalDate.now());
        saveSchedule(entries, result.getBlocks());

        return result;
    }

    // Preserve Completed, Reschedule Rest
    @Transactional
    public SchedulerResult rebalance(Long userId, SchedulerSettings settings) {
        try {
            LocalDate today = LocalDate.now();
            List<StudyPlanEntry> entries = entryRepository.findByUserId(userId);

            Map<Long, Double> pastUncompletedHours = new HashMap<>();
            for (StudyPlanEntry entry : entries) {
                double pastHrs = blockRepository.findPastUncompletedBlocks(entry, today)
                        .stream()
                        .mapToDouble(StudyBlock::getDuration)
                        .sum();
                pastUncompletedHours.put(entry.getId(), pastHrs);
            }

            for (StudyPlanEntry entry : entries) {
                blockRepository.deleteByStudyPlanEntryAndCompletedFalseAndDayGreaterThanEqual(entry, today);
            }
            entityManager.flush();
            for (StudyPlanEntry entry : entries) {
                entityManager.refresh(entry);
            }

            List<StudyPlanEntry> adjustedEntries = new ArrayList<>();
            for (StudyPlanEntry entry : entries) {
                double alreadyDone = entry.getCompletedHours()
                        + pastUncompletedHours.getOrDefault(entry.getId(), 0.0);
                double futureWorkload = Math.max(0, entry.getEstimatedWorkload() - alreadyDone);

                StudyPlanEntry adjusted = new StudyPlanEntry(futureWorkload, 0);
                adjusted.setTask(entry.getTask());
                adjustedEntries.add(adjusted);
            }

            SchedulerResult result = schedulerService.rebalance(adjustedEntries, settings, today);

            List<StudyBlock> reattachedBlocks = new ArrayList<>();
            for (StudyBlock block : result.getBlocks()) {
                int idx = adjustedEntries.indexOf(block.getStudyPlanEntry());
                if (idx >= 0) {
                    block.setStudyPlanEntry(entries.get(idx));
                }
                reattachedBlocks.add(block);
            }

            saveSchedule(entries, reattachedBlocks);
            return result;

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
        LocalDate weekEnd = weekStart.plusDays(6);

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

    @Transactional
    public int markPastBlocksDone(Long userId) {
        LocalDate today = LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now();

        List<StudyBlock> pastBlocks = blockRepository.findAllPastUncompletedForUser(userId, today, now);
        if (pastBlocks.isEmpty()) return 0;

        Map<Long, StudyPlanEntry> entryCache = new HashMap<>();
        for (StudyBlock block : pastBlocks) {
            block.setCompleted(true);

            StudyPlanEntry entry = entryCache.computeIfAbsent(
                    block.getStudyPlanEntry().getId(),
                    id -> entryRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Entry not found: " + id))
            );
            entry.setCompletedHours(entry.getCompletedHours() + block.getDuration());
        }

        blockRepository.saveAll(pastBlocks);
        entryRepository.saveAll(entryCache.values());

        return pastBlocks.size();
    }

    @Transactional
    public void clearAllBlocks(Long userId) {
        List<StudyPlanEntry> entries = entryRepository.findByUserId(userId);
        blockRepository.deleteAllByUserId(userId);
        entityManager.flush();
        for (StudyPlanEntry entry : entries) {
            entry.setCompletedHours(0);
            entryRepository.save(entry);
        }
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

    public List<AvailabilitySlot> getSlots(Long userId) {
        return slotRepository.findByUserId(userId);
    }

    @org.springframework.transaction.annotation.Transactional
    public List<AvailabilitySlot> saveSlots(Long userId, List<java.util.Map<String, Object>> slots) {
        slotRepository.deleteAllByUserId(userId);
        com.koursekit.model.User user = entityManager.getReference(com.koursekit.model.User.class, userId);
        List<AvailabilitySlot> saved = new java.util.ArrayList<>();
        for (java.util.Map<String, Object> s : slots) {
            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setUser(user);
            slot.setDayKey((String) s.get("dayKey"));
            slot.setStartTime(java.time.LocalTime.parse((String) s.get("startTime")));
            slot.setEndTime(java.time.LocalTime.parse((String) s.get("endTime")));
            saved.add(slotRepository.save(slot));
        }
        return saved;
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearSlots(Long userId) {
        slotRepository.deleteAllByUserId(userId);
    }
}