package com.koursekit.service;
import com.koursekit.model.AvailabilitySlot;
import com.koursekit.model.DefaultScheduleSlot;
import com.koursekit.repository.AvailabilitySlotRepository;
import com.koursekit.repository.DefaultScheduleSlotRepository;

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

    @Autowired
    private DefaultScheduleSlotRepository defaultSlotRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public StudyPlanEntry createEntry(Long userId, Long taskId, double estimatedWorkload, LocalDate weekStart) {
        User user = entityManager.getReference(User.class, userId);
        Task task = entityManager.find(Task.class, taskId);
        if (task == null) throw new RuntimeException("Task not found: " + taskId);

        boolean duplicate = entryRepository.existsByUserIdAndTaskIdAndWeekStart(userId, taskId, weekStart);
        if (duplicate) throw new RuntimeException("Entry for this task already exists this week");

        StudyPlanEntry entry = new StudyPlanEntry();
        entry.setUser(user);
        entry.setTask(task);
        entry.setEstimatedWorkload(estimatedWorkload);
        entry.setCompletedHours(0);
        entry.setWeekStart(weekStart);

        return entryRepository.save(entry);
    }

    @Transactional
    public SchedulerResult generatePlan(Long userId, SchedulerSettings settings, LocalDate weekStart) {
        List<StudyPlanEntry> entries = entryRepository.findByUserIdAndWeekStart(userId, weekStart);
        if (entries.isEmpty()) return new SchedulerResult(Collections.emptyList(), Collections.emptyList());

        List<Long> entryIds = entries.stream().map(StudyPlanEntry::getId).toList();

        // Bulk-delete uncompleted blocks for this week
        LocalDate weekEnd = weekStart.plusDays(6);
        blockRepository.deleteUncompletedByEntryIdsAndDayBetween(entryIds, weekStart, weekEnd);
        // Bulk-reset completedHours to 0
        entryRepository.resetCompletedHoursByIds(entryIds);
        entityManager.flush();
        // Sync in-memory state so the scheduler sees completedHours = 0
        entries.forEach(e -> e.setCompletedHours(0));

        // Start from today if current week, otherwise from weekStart (Monday)
        LocalDate startDate = weekStart.isAfter(LocalDate.now()) ? weekStart : LocalDate.now();
        SchedulerResult result = schedulerService.generatePlan(entries, settings, startDate, weekStart);
        saveSchedule(entries, result.getBlocks());

        return result;
    }

    @Transactional
    public SchedulerResult rebalance(Long userId, SchedulerSettings settings, LocalDate weekStart) {
        try {
            LocalDate today = weekStart.isAfter(LocalDate.now()) ? weekStart : LocalDate.now();
            List<StudyPlanEntry> entries = entryRepository.findByUserIdAndWeekStart(userId, weekStart);
            if (entries.isEmpty()) return new SchedulerResult(Collections.emptyList(), Collections.emptyList());

            List<Long> entryIds = entries.stream().map(StudyPlanEntry::getId).toList();

            // Load completed and pinned blocks in 2 bulk queries instead of 2×N
            Map<Long, List<StudyBlock>> completedBlocksByEntry = new HashMap<>();
            Map<Long, Double> completedHoursByEntry = new HashMap<>();
            for (StudyBlock b : blockRepository.findCompletedByEntryIds(entryIds)) {
                completedBlocksByEntry.computeIfAbsent(b.getStudyPlanEntry().getId(), k -> new ArrayList<>()).add(b);
            }
            entryIds.forEach(id -> {
                List<StudyBlock> list = completedBlocksByEntry.getOrDefault(id, Collections.emptyList());
                completedBlocksByEntry.putIfAbsent(id, Collections.emptyList());
                completedHoursByEntry.put(id, list.stream().mapToDouble(StudyBlock::getDuration).sum());
            });

            Map<Long, List<StudyBlock>> pinnedBlocksByEntry = new HashMap<>();
            Map<Long, Double> pinnedHoursByEntry = new HashMap<>();
            for (StudyBlock b : blockRepository.findPinnedUncompletedByEntryIds(entryIds)) {
                pinnedBlocksByEntry.computeIfAbsent(b.getStudyPlanEntry().getId(), k -> new ArrayList<>()).add(b);
            }
            entryIds.forEach(id -> {
                List<StudyBlock> list = pinnedBlocksByEntry.getOrDefault(id, Collections.emptyList());
                pinnedBlocksByEntry.putIfAbsent(id, Collections.emptyList());
                pinnedHoursByEntry.put(id, list.stream().mapToDouble(StudyBlock::getDuration).sum());
            });

            // Bulk-delete uncompleted unpinned blocks in one query
            blockRepository.deleteUncompletedUnpinnedByEntryIds(entryIds);
            entityManager.flush();

            Map<Long, Double> originalWorkloads = new HashMap<>();
            for (StudyPlanEntry entry : entries) {
                originalWorkloads.put(entry.getId(), entry.getEstimatedWorkload());
                double completedHrs = completedHoursByEntry.getOrDefault(entry.getId(), 0.0);
                double pinnedHrs = pinnedHoursByEntry.getOrDefault(entry.getId(), 0.0);
                double futureWorkload = Math.max(0, entry.getEstimatedWorkload() - completedHrs - pinnedHrs);
                entry.setEstimatedWorkload(futureWorkload);
                entry.setCompletedHours(0);
            }
            entryRepository.saveAll(entries);
            entityManager.flush();

            for (StudyPlanEntry entry : entries) {
                List<StudyBlock> completed = completedBlocksByEntry.getOrDefault(entry.getId(), new ArrayList<>());
                List<StudyBlock> pinned = pinnedBlocksByEntry.getOrDefault(entry.getId(), new ArrayList<>());
                entry.getAssignedBlocks().clear();
                entry.getAssignedBlocks().addAll(completed);
                entry.getAssignedBlocks().addAll(pinned);
            }

            SchedulerResult result = schedulerService.rebalance(entries, settings, today, weekStart);

            List<StudyBlock> newBlocks = result.getBlocks().stream()
                    .filter(b -> !b.isCompleted())
                    .toList();
            blockRepository.saveAll(newBlocks);

            for (StudyPlanEntry entry : entries) {
                entry.setEstimatedWorkload(originalWorkloads.get(entry.getId()));
                entry.setCompletedHours(completedHoursByEntry.getOrDefault(entry.getId(), 0.0));
            }
            entryRepository.saveAll(entries);

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

        block.setCompleted(true);
        blockRepository.save(block);

        StudyPlanEntry entry = block.getStudyPlanEntry();
        entry.setCompletedHours(entry.getCompletedHours() + block.getDuration());
        entryRepository.save(entry);
    }

    @Transactional
    public void uncompletedBlock(Long blockId) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Block not found"));

        if (!block.isCompleted()) return;

        block.setCompleted(false);
        blockRepository.save(block);

        StudyPlanEntry entry = block.getStudyPlanEntry();
        entry.setCompletedHours(Math.max(0, entry.getCompletedHours() - block.getDuration()));
        entryRepository.save(entry);
    }

    public Map<DayOfWeek, List<StudyBlock>> getWeeklyView(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);

        List<StudyBlock> blocks = blockRepository.findByStudyPlanEntry_User_IdAndDayBetween(
                userId, weekStart, weekEnd);

        return blocks.stream()
                .collect(Collectors.groupingBy(
                        block -> block.getDay().getDayOfWeek(),
                        TreeMap::new,
                        Collectors.toList()
                ));
    }

    @Transactional
    public void deleteBlock(Long blockId) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("StudyBlock", blockId));

        if (block.isCompleted()) {
            Long entryId = block.getStudyPlanEntry().getId();
            StudyPlanEntry entry = entryRepository.findById(entryId)
                    .orElseThrow(() -> new ResourceNotFoundException("StudyPlanEntry", entryId));
            entry.setCompletedHours(Math.max(0, entry.getCompletedHours() - block.getDuration()));
            entryRepository.save(entry);
        }

        // Shrink or delete the availability slot that contains this block
        Long userId = block.getStudyPlanEntry().getTask().getUserId();
        // weekStart = Monday of the block's day
        java.time.LocalDate weekStart = block.getDay()
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        String dayKey = block.getDay().getDayOfWeek().name(); // e.g. "MONDAY"
        java.time.LocalTime blockStart = block.getStartTime();
        java.time.LocalTime blockEnd = blockStart.plusMinutes((long)(block.getDuration() * 60));

        // Load all other blocks on the same day so we can check if anything else sits in the slot
        List<StudyBlock> otherDayBlocks = blockRepository
                .findByStudyPlanEntry_User_IdAndDayBetween(userId, block.getDay(), block.getDay())
                .stream()
                .filter(b -> !b.getId().equals(blockId))
                .toList();

        List<AvailabilitySlot> slots = slotRepository.findByUserIdAndWeekStart(userId, weekStart);
        for (AvailabilitySlot slot : slots) {
            if (!slot.getDayKey().equals(dayKey)) continue;
            java.time.LocalTime slotStart = slot.getStartTime();
            java.time.LocalTime slotEnd = slot.getEndTime();
            if (!blockStart.isBefore(slotStart) && !blockEnd.isAfter(slotEnd)) {
                // Check if any other block occupies this slot
                boolean otherBlocksInSlot = otherDayBlocks.stream().anyMatch(b -> {
                    java.time.LocalTime bStart = b.getStartTime();
                    return !bStart.isBefore(slotStart) && bStart.isBefore(slotEnd);
                });

                if (!otherBlocksInSlot) {
                    // No other study blocks in this slot — remove the whole slot
                    slotRepository.delete(slot);
                } else if (blockStart.equals(slotStart) && blockEnd.equals(slotEnd)) {
                    // Block fills entire slot — delete slot
                    slotRepository.delete(slot);
                } else if (blockStart.equals(slotStart)) {
                    // Block is at the start — shrink slot forward
                    slot.setStartTime(blockEnd);
                    slotRepository.save(slot);
                } else if (blockEnd.equals(slotEnd)) {
                    // Block is at the end — shrink slot backward
                    slot.setEndTime(blockStart);
                    slotRepository.save(slot);
                } else {
                    // Block is in the middle — split into two slots
                    slot.setEndTime(blockStart);
                    slotRepository.save(slot);
                    AvailabilitySlot second = new AvailabilitySlot();
                    second.setUser(slot.getUser());
                    second.setDayKey(slot.getDayKey());
                    second.setWeekStart(slot.getWeekStart());
                    second.setStartTime(blockEnd);
                    second.setEndTime(slotEnd);
                    slotRepository.save(second);
                }
                break;
            }
        }

        blockRepository.delete(block);
    }

    @Transactional
    public void deleteEntry(Long entryId) {
        StudyPlanEntry entry = getEntry(entryId);
        blockRepository.deleteAll(blockRepository.findByStudyPlanEntry(entry));
        entryRepository.delete(entry);
    }

    @Transactional
    public StudyPlanEntry updateEntry(Long entryId, StudyPlanEntry updates) {
        StudyPlanEntry existing = getEntry(entryId);

        if (updates.getTask() != null) existing.setTask(updates.getTask());
        if (updates.getEstimatedWorkload() > 0) existing.setEstimatedWorkload(updates.getEstimatedWorkload());

        return entryRepository.save(existing);
    }

    @Transactional
    public StudyBlock editBlock(Long blockId, Map<String, Object> updates) {
        StudyBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResourceNotFoundException("StudyBlock", blockId));

        // Save old time boundaries before applying updates
        java.time.LocalTime oldBlockStart = block.getStartTime();
        java.time.LocalTime oldBlockEnd = oldBlockStart.plusMinutes((long)(block.getDuration() * 60));

        if (updates.containsKey("studyPlanEntryId")) {
            Long newEntryId = ((Number) updates.get("studyPlanEntryId")).longValue();
            StudyPlanEntry newEntry = entryRepository.findById(newEntryId)
                    .orElseThrow(() -> new ResourceNotFoundException("StudyPlanEntry", newEntryId));
            if (block.isCompleted()) {
                StudyPlanEntry oldEntry = block.getStudyPlanEntry();
                oldEntry.setCompletedHours(Math.max(0, oldEntry.getCompletedHours() - block.getDuration()));
                entryRepository.save(oldEntry);
                newEntry.setCompletedHours(newEntry.getCompletedHours() + block.getDuration());
                entryRepository.save(newEntry);
            }
            block.setStudyPlanEntry(newEntry);
        }

        if (updates.containsKey("startTime")) {
            block.setStartTime(java.time.LocalTime.parse((String) updates.get("startTime")));
        }

        if (updates.containsKey("duration")) {
            double newDuration = ((Number) updates.get("duration")).doubleValue();
            if (block.isCompleted()) {
                StudyPlanEntry entry = block.getStudyPlanEntry();
                double diff = newDuration - block.getDuration();
                entry.setCompletedHours(Math.max(0, entry.getCompletedHours() + diff));
                entryRepository.save(entry);
            }
            block.setDuration(newDuration);
        }

        block.setPinned(true);
        StudyBlock saved = blockRepository.save(block);

        // Update the containing availability slot to match the new block boundaries
        java.time.LocalTime newBlockStart = block.getStartTime();
        java.time.LocalTime newBlockEnd = newBlockStart.plusMinutes((long)(block.getDuration() * 60));
        if (!newBlockStart.equals(oldBlockStart) || !newBlockEnd.equals(oldBlockEnd)) {
            Long userId = block.getStudyPlanEntry().getTask().getUserId();
            java.time.LocalDate blockWeekStart = block.getDay()
                    .with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            String dayKey = block.getDay().getDayOfWeek().name();
            List<AvailabilitySlot> slots = slotRepository.findByUserIdAndWeekStart(userId, blockWeekStart);
            for (AvailabilitySlot slot : slots) {
                if (!slot.getDayKey().equals(dayKey)) continue;
                java.time.LocalTime slotStart = slot.getStartTime();
                java.time.LocalTime slotEnd = slot.getEndTime();
                boolean oldStartInSlot = !oldBlockStart.isBefore(slotStart) && oldBlockStart.isBefore(slotEnd);
                if (!oldStartInSlot) continue;
                // Exact match: slot boundaries == old block boundaries → resize to new block
                if (slotStart.equals(oldBlockStart) && slotEnd.equals(oldBlockEnd)) {
                    slot.setStartTime(newBlockStart);
                    slot.setEndTime(newBlockEnd);
                    slotRepository.save(slot);
                // Old block was at the end of the slot → shrink/grow the slot end
                } else if (slotEnd.equals(oldBlockEnd)) {
                    slot.setEndTime(newBlockEnd);
                    slotRepository.save(slot);
                // Old block was at the start of the slot → shift the slot start
                } else if (slotStart.equals(oldBlockStart)) {
                    slot.setStartTime(newBlockStart);
                    slotRepository.save(slot);
                }
                break;
            }
        }

        return saved;
    }

    @Transactional
    public int markPastBlocksDone(Long userId) {
        LocalDate today = LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now();

        List<StudyBlock> pastBlocks = blockRepository.findAllPastUncompletedForUser(userId, today, now);
        if (pastBlocks.isEmpty()) return 0;

        List<Long> ids = pastBlocks.stream().map(StudyBlock::getId).toList();
        blockRepository.markAllCompletedByIds(ids);

        Map<Long, StudyPlanEntry> entryCache = new HashMap<>();
        for (StudyBlock block : pastBlocks) {
            StudyPlanEntry entry = entryCache.computeIfAbsent(
                    block.getStudyPlanEntry().getId(),
                    id -> entryRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Entry not found: " + id))
            );
            entry.setCompletedHours(entry.getCompletedHours() + block.getDuration());
        }
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

    @Transactional
    public void clearBlocksByWeek(Long userId, LocalDate weekStart) {
        List<StudyPlanEntry> entries = entryRepository.findByUserIdAndWeekStart(userId, weekStart);
        blockRepository.deleteAllByUserIdAndWeekStart(userId, weekStart);
        entityManager.flush();
        for (StudyPlanEntry entry : entries) {
            entry.setCompletedHours(0);
            entryRepository.save(entry);
        }
    }

    private void saveSchedule(List<StudyPlanEntry> entries, List<StudyBlock> blocks) {
        blockRepository.saveAll(blocks);
    }

    public List<StudyPlanEntry> getActiveEntries(Long userId, LocalDate weekStart) {
        return entryRepository.findByUserIdAndWeekStart(userId, weekStart);
    }

    public StudyPlanEntry getEntry(Long entryId) {
        return entryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
    }

    @org.springframework.transaction.annotation.Transactional
    public List<AvailabilitySlot> getSlots(Long userId, LocalDate weekStart, String semester) {
        List<AvailabilitySlot> existing = slotRepository.findByUserIdAndWeekStart(userId, weekStart);
        if (!existing.isEmpty()) {
            boolean wrongSemester = semester != null && !semester.isBlank() &&
                    existing.stream().anyMatch(s -> !semester.equals(s.getSemesterName()));
            if (!wrongSemester) return existing;
            slotRepository.deleteByUserIdAndWeekStart(userId, weekStart);
            existing = java.util.Collections.emptyList();
        }

        // No slots for this week — seed from the user's default schedule
        List<DefaultScheduleSlot> defaults = (semester != null && !semester.isBlank())
                ? defaultSlotRepository.findByUserIdAndSemesterName(userId, semester)
                : defaultSlotRepository.findByUserId(userId);
        if (defaults.isEmpty()) return existing;

        User user = entityManager.getReference(User.class, userId);
        List<AvailabilitySlot> seeded = new ArrayList<>();
        for (DefaultScheduleSlot def : defaults) {
            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setUser(user);
            slot.setDayKey(def.getDayKey());
            slot.setStartTime(def.getStartTime());
            slot.setEndTime(def.getEndTime());
            slot.setWeekStart(weekStart);
            slot.setSemesterName(semester);
            seeded.add(slot);
        }
        return slotRepository.saveAll(seeded);
    }

    @org.springframework.transaction.annotation.Transactional
    public List<AvailabilitySlot> saveSlots(Long userId, LocalDate weekStart, String semester, List<java.util.Map<String, Object>> slots) {
        slotRepository.deleteByUserIdAndWeekStart(userId, weekStart);
        entityManager.flush();
        com.koursekit.model.User user = entityManager.getReference(com.koursekit.model.User.class, userId);
        List<AvailabilitySlot> toSave = new java.util.ArrayList<>();
        for (java.util.Map<String, Object> s : slots) {
            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setUser(user);
            slot.setDayKey((String) s.get("dayKey"));
            slot.setStartTime(java.time.LocalTime.parse((String) s.get("startTime")));
            slot.setEndTime(java.time.LocalTime.parse((String) s.get("endTime")));
            slot.setWeekStart(weekStart);
            slot.setSemesterName(semester);
            toSave.add(slot);
        }
        return slotRepository.saveAll(toSave);
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearSlots(Long userId, LocalDate weekStart) {
        slotRepository.deleteByUserIdAndWeekStart(userId, weekStart);
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearAllSlots(Long userId) {
        slotRepository.deleteAllByUserId(userId);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void syncSlotsFromDefault(Long userId) {
        List<LocalDate> weeks = slotRepository.findDistinctWeekStartsByUserId(userId);
        for (LocalDate weekStart : weeks) {
            LocalDate weekEnd = weekStart.plusDays(6);
            List<StudyBlock> blocks = blockRepository.findByStudyPlanEntry_User_IdAndDayBetween(userId, weekStart, weekEnd);
            if (blocks.isEmpty()) {
                slotRepository.deleteByUserIdAndWeekStart(userId, weekStart);
            }
        }
    }
}