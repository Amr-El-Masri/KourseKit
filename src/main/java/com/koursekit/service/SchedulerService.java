package com.koursekit.service;
import com.koursekit.model.*;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
@Service
public class SchedulerService {

    // Deletes everything and generates a new plan
    public SchedulerResult generatePlan(
            List<StudyPlanEntry> entries,
            SchedulerSettings settings,
            LocalDate startDate
    ) {
        // Sort by deadline (Earliest Deadline First)
        List<StudyPlanEntry> sorted = entries.stream()
                .sorted(Comparator.comparing(e -> e.getTask().getDeadline()))
                .toList();

        // Track slot usage: "date_slotStart" → hours used
        Map<String, Double> slotLoad = new HashMap<>();

        //Track subject hours per day: "date_taskTitle" → hours used
        Map<String, Double> subjectLoadPerDay = new HashMap<>();

        List<StudyBlock> allBlocks = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Schedule each entry
        for (StudyPlanEntry entry : sorted) {
            ScheduleResult result = scheduleEntry(entry, settings, startDate, slotLoad, subjectLoadPerDay);
            allBlocks.addAll(result.blocks);

            // TODO: not sure about this
            if (result.overloaded) {
                warnings.add(String.format(
                        "Task '%s' (deadline: %s) — %.1f hour(s) could not fit before deadline.",
                        entry.getTask().getTitle(),
                        entry.getTask().getDeadline(),
                        result.unscheduledHours
                ));
            }
        }

        return new SchedulerResult(allBlocks, warnings);
    }

    // Keeps the completed blocks and rebalance the remaining and the new added ones
    public SchedulerResult rebalance(
            List<StudyPlanEntry> entries,
            SchedulerSettings settings,
            LocalDate startDate
    ) {
        Map<String, Double> slotLoad = new HashMap<>();
        Map<String, Double> subjectLoadPerDay = new HashMap<>();
        List<StudyBlock> allBlocks = new ArrayList<>();

        // Step 1: Lock completed blocks
        for (StudyPlanEntry entry : entries) {
            for (StudyBlock block : entry.getAssignedBlocks()) {
                if (block.isCompleted()) {
                    String slotKey = slotKey(block.getDay(), block.getStartTime());

                    // if key exists combine old value with new value, else add new value
                    slotLoad.merge(slotKey, block.getDuration(), Double::sum);

                    // Also track completed hours for subject-per-day limit
                    String subjectKey = subjectKey(block.getDay(), entry.getTask().getTitle());

                    // if key exists combine old value with new value, else add new value
                    subjectLoadPerDay.merge(subjectKey, block.getDuration(), Double::sum);

                    allBlocks.add(block);
                }
            }
        }

        // Step 2: Sort remaining work by deadline
        List<StudyPlanEntry> sorted = entries.stream()
                .filter(e -> e.getEstimatedWorkload() - e.getCompletedHours() > 0)
                .sorted(Comparator.comparing(e -> e.getTask().getDeadline()))
                .toList();

        // Step 3: Reschedule remaining work
        List<String> warnings = new ArrayList<>();
        for (StudyPlanEntry entry : sorted) {
            ScheduleResult result = scheduleEntry(entry, settings, startDate, slotLoad, subjectLoadPerDay);
            allBlocks.addAll(result.blocks);

            //TODO: unsure about this
            if (result.overloaded) {
                warnings.add(String.format(
                        "Task '%s' (deadline: %s) — %.1f hour(s) cannot fit after rebalance.",
                        entry.getTask().getTitle(),
                        entry.getTask().getDeadline(),
                        result.unscheduledHours
                ));
            }
        }

        return new SchedulerResult(allBlocks, warnings);
    }



    //Schedules one entry by filling available time slots greedily.

    private ScheduleResult scheduleEntry(
            StudyPlanEntry entry,
            SchedulerSettings settings,
            LocalDate startDate,
            Map<String, Double> slotLoad,
            Map<String, Double> subjectLoadPerDay
    ) {
        double remaining = entry.getEstimatedWorkload() - entry.getCompletedHours();

        if (remaining <= 0.001) {
            return new ScheduleResult(Collections.emptyList(), false, 0);
        }

        // Apply deadline buffer
        LocalDate effectiveDeadline = LocalDate.from(entry.getTask().getDeadline()
                .minusDays(settings.getDeadlineBufferDays()));

        List<LocalDate> availableDays = getAvailableDays(startDate, effectiveDeadline, settings);
        List<StudyBlock> blocks = new ArrayList<>();

        String taskTitle = entry.getTask().getTitle();

        //walk days and slots chronologically
        for (LocalDate day : availableDays) {
            if (remaining <= 0.001) break;

            // Check how much of this subject already scheduled today
            String daySubjectKey = subjectKey(day, taskTitle);
            double subjectHoursToday = subjectLoadPerDay.getOrDefault(daySubjectKey, 0.0);
            double subjectCapacityToday = settings.getMaxHoursPerSubjectPerDay() - subjectHoursToday;

            if (subjectCapacityToday <= 0.001) {
                // Already hit daily limit for this subject, skip to next day
                continue;
            }

            DayOfWeek dayOfWeek = day.getDayOfWeek();
            DaySchedule daySchedule = settings.getAvailability().get(dayOfWeek);
            if (daySchedule == null) continue;

            List<TimeSlot> usableSlots = daySchedule.getUsableSlots(settings.getMinimumSessionHours());

            for (TimeSlot slot : usableSlots) {
                if (remaining <= 0.001) break;
                if (subjectCapacityToday <= 0.001) break;  // Hit daily subject limit

                String key = slotKey(day, slot.getStart());
                double slotUsed = slotLoad.getOrDefault(key, 0.0);
                double slotCapacity = slot.getDurationHours() - slotUsed;

                if (slotCapacity < settings.getMinimumSessionHours()) {
                    continue;
                }

                //Don't exceed remaining hours
                // Don't exceed available slot capacity
                double assign = Math.min(remaining, slotCapacity);

                //Don't exceed max session length
                assign = Math.min(assign, settings.getMaximumSessionHours());

                // Don't exceed daily subject limit
                assign = Math.min(assign, subjectCapacityToday);  // NEW CONSTRAINT

                // Round to nearest 0.5h
                assign = Math.floor(assign * 2) / 2.0;

                if (assign < settings.getMinimumSessionHours()) {
                    continue;
                }

                // Calculate start time within slot
                LocalTime blockStart = slot.getStart().plusMinutes((long) (slotUsed * 60));

                // Create block
                StudyBlock block = new StudyBlock();
                block.setStudyPlanEntry(entry);
                block.setDay(day);
                block.setStartTime(blockStart);
                block.setDuration(assign);
                block.setCompleted(false);

                blocks.add(block);

                // Update slot usage
                slotLoad.put(key, slotUsed + assign);

                // NEW: Update subject usage for this day
                subjectLoadPerDay.put(daySubjectKey, subjectHoursToday + assign);
                subjectCapacityToday -= assign;

                remaining -= assign;
            }
        }

        boolean overloaded = remaining > 0.001;
        return new ScheduleResult(blocks, overloaded, overloaded ? remaining : 0);
    }

    //  HELPERS

    private List<LocalDate> getAvailableDays(
            LocalDate startDate,
            LocalDate deadline,
            SchedulerSettings settings
    ) {
        List<LocalDate> days = new ArrayList<>();
        LocalDate cursor = startDate;

        while (!cursor.isAfter(deadline)) {
            if (settings.getStudyDays().contains(cursor.getDayOfWeek())) {
                days.add(cursor);
            }
            cursor = cursor.plusDays(1);
        }

        return days;
    }

    private String slotKey(LocalDate date, LocalTime slotStart) {
        return date + "_" + slotStart;
    }


    private String subjectKey(LocalDate date, String taskTitle) {
        return date + "_" + taskTitle;
    }

    //private inner class result
    private record ScheduleResult(List<StudyBlock> blocks, boolean overloaded, double unscheduledHours) {
    }
}
