package com.koursekit.service;
import com.koursekit.model.*;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SchedulerService {

    public SchedulerResult generatePlan(
            List<StudyPlanEntry> entries,
            SchedulerSettings settings,
            LocalDate startDate,
            LocalDate weekStart
    ) {
        List<StudyPlanEntry> sorted = entries.stream()
                .sorted(Comparator.comparingDouble(e -> {
                    long daysLeft = ChronoUnit.DAYS.between(startDate, e.getTask().getDeadline().toLocalDate());
                    double hoursLeft = Math.max(e.getEstimatedWorkload() - e.getCompletedHours(), 0.5);
                    return daysLeft / hoursLeft;
                }))
                .toList();

        Map<String, Double> slotLoad = new HashMap<>();
        Map<String, Double> subjectLoadPerDay = new HashMap<>();
        List<StudyBlock> allBlocks = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (StudyPlanEntry entry : sorted) {
            ScheduleResult result = scheduleEntry(entry, settings, startDate, weekStart, slotLoad, subjectLoadPerDay);
            allBlocks.addAll(result.blocks());
            if (result.overloaded()) {
                warnings.add(String.format(
                        "Task '%s' (deadline: %s) — %.1f hour(s) could not fit before deadline.",
                        entry.getTask().getTitle(),
                        entry.getTask().getDeadline(),
                        result.unscheduledHours()
                ));
            }
        }

        return new SchedulerResult(allBlocks, warnings);
    }

    public SchedulerResult rebalance(
            List<StudyPlanEntry> entries,
            SchedulerSettings settings,
            LocalDate startDate,
            LocalDate weekStart
    ) {
        Map<String, Double> slotLoad = new HashMap<>();
        Map<String, Double> subjectLoadPerDay = new HashMap<>();
        List<StudyBlock> allBlocks = new ArrayList<>();

        for (StudyPlanEntry entry : entries) {
            for (StudyBlock block : entry.getAssignedBlocks()) {
                if (block.isCompleted() || block.isPinned()) {
                    DayOfWeek dow = block.getDay().getDayOfWeek();
                    DaySchedule daySchedule = settings.getAvailability().get(dow);
                    if (daySchedule != null) {
                        for (TimeSlot slot : daySchedule.getSlots()) {
                            if (!block.getStartTime().isBefore(slot.getStart())
                                    && block.getStartTime().isBefore(slot.getEnd())) {
                                slotLoad.merge(slotKey(block.getDay(), slot.getStart()), block.getDuration(), Double::sum);
                                break;
                            }
                        }
                    }
                    subjectLoadPerDay.merge(subjectKey(block.getDay(), entry.getTask().getTitle()), block.getDuration(), Double::sum);
                    allBlocks.add(block);
                }
            }
        }

        List<StudyPlanEntry> sorted = entries.stream()
                .filter(e -> e.getEstimatedWorkload() - e.getCompletedHours() > 0)
                .sorted(Comparator.comparingDouble(e -> {
                    long daysLeft = ChronoUnit.DAYS.between(startDate, e.getTask().getDeadline().toLocalDate());
                    double hoursLeft = Math.max(e.getEstimatedWorkload() - e.getCompletedHours(), 0.5);
                    return daysLeft / hoursLeft;
                }))
                .toList();

        List<String> warnings = new ArrayList<>();
        for (StudyPlanEntry entry : sorted) {
            ScheduleResult result = scheduleEntry(entry, settings, startDate, weekStart, slotLoad, subjectLoadPerDay);
            allBlocks.addAll(result.blocks());
            if (result.overloaded()) {
                warnings.add(String.format(
                        "Task '%s' (deadline: %s) — %.1f hour(s) cannot fit after rebalance.",
                        entry.getTask().getTitle(),
                        entry.getTask().getDeadline(),
                        result.unscheduledHours()
                ));
            }
        }

        return new SchedulerResult(allBlocks, warnings);
    }

    private ScheduleResult scheduleEntry(
            StudyPlanEntry entry,
            SchedulerSettings settings,
            LocalDate startDate,
            LocalDate weekStart,
            Map<String, Double> slotLoad,
            Map<String, Double> subjectLoadPerDay
    ) {
        double remaining = entry.getEstimatedWorkload() - entry.getCompletedHours();

        if (remaining <= 0.001) {
            return new ScheduleResult(Collections.emptyList(), false, 0);
        }

        // Use deadline as-is — schedule blocks up to and including the deadline day
        LocalDate effectiveDeadline = LocalDate.from(entry.getTask().getDeadline());

        List<LocalDate> availableDays = getAvailableDays(startDate, weekStart, effectiveDeadline, settings);
        System.out.println("DEBUG scheduleEntry: task=" + entry.getTask().getTitle()
                + " startDate=" + startDate + " weekStart=" + weekStart
                + " effectiveDeadline=" + effectiveDeadline
                + " availableDays=" + availableDays
                + " studyDays=" + settings.getStudyDays()
                + " availabilityKeys=" + settings.getAvailability().keySet()
                + " remaining=" + remaining);
        List<StudyBlock> blocks = new ArrayList<>();
        String taskTitle = entry.getTask().getTitle();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (LocalDate day : availableDays) {
            if (remaining <= 0.001) break;

            String daySubjectKey = subjectKey(day, taskTitle);
            double subjectHoursToday = subjectLoadPerDay.getOrDefault(daySubjectKey, 0.0);
            double subjectCapacityToday = settings.getMaxHoursPerSubjectPerDay() - subjectHoursToday;

            if (subjectCapacityToday <= 0.001) continue;

            DayOfWeek dayOfWeek = day.getDayOfWeek();
            DaySchedule daySchedule = settings.getAvailability().get(dayOfWeek);
            if (daySchedule == null) continue;

            List<TimeSlot> usableSlots = daySchedule.getUsableSlots(settings.getMinimumSessionHours());

            for (TimeSlot slot : usableSlots) {
                if (remaining <= 0.001) break;
                if (subjectCapacityToday <= 0.001) break;

                if (day.equals(today) && slot.getEnd().isBefore(now)) continue;

                String key = slotKey(day, slot.getStart());
                double slotUsed = slotLoad.getOrDefault(key, 0.0);

                if (day.equals(today) && slot.getStart().isBefore(now)) {
                    long minutesPast = ChronoUnit.MINUTES.between(slot.getStart(), now);
                    double hoursPast = Math.ceil((minutesPast / 60.0) * 2) / 2.0;
                    slotUsed = Math.max(slotUsed, hoursPast);
                }

                double slotCapacity = slot.getDurationHours() - slotUsed;

                if (slotCapacity < settings.getMinimumSessionHours()) continue;

                double assign = Math.min(remaining, slotCapacity);
                assign = Math.min(assign, settings.getMaximumSessionHours());
                assign = Math.min(assign, subjectCapacityToday);
                assign = Math.floor(assign * 2) / 2.0;

                if (assign < settings.getMinimumSessionHours()) {
                    if (slotCapacity >= settings.getMinimumSessionHours()) {
                        assign = settings.getMinimumSessionHours();
                    } else {
                        continue;
                    }
                }

                LocalTime blockStart = slot.getStart().plusMinutes((long) (slotUsed * 60));

                StudyBlock block = new StudyBlock();
                block.setStudyPlanEntry(entry);
                block.setDay(day);
                block.setStartTime(blockStart);
                block.setDuration(assign);
                block.setCompleted(false);

                blocks.add(block);

                slotLoad.put(key, slotUsed + assign);
                subjectLoadPerDay.put(daySubjectKey, subjectHoursToday + assign);
                subjectCapacityToday -= assign;
                remaining -= assign;
            }
        }

        boolean overloaded = remaining > 0.001;
        return new ScheduleResult(blocks, overloaded, overloaded ? remaining : 0);
    }

    private List<LocalDate> getAvailableDays(
            LocalDate startDate,
            LocalDate weekStart,
            LocalDate deadline,
            SchedulerSettings settings
    ) {
        List<LocalDate> days = new ArrayList<>();

        // Normalize weekStart to Monday defensively (frontend timezone can shift it to Sunday)
        LocalDate normalizedWeekStart = weekStart.with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = normalizedWeekStart.plusDays(6); // Sunday
        LocalDate effectiveEnd = deadline.isBefore(weekEnd) ? deadline : weekEnd;

        // startDate should also not be before normalizedWeekStart
        LocalDate cursor = startDate.isBefore(normalizedWeekStart) ? normalizedWeekStart : startDate;
        while (!cursor.isAfter(effectiveEnd)) {
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

    private record ScheduleResult(List<StudyBlock> blocks, boolean overloaded, double unscheduledHours) {}
}