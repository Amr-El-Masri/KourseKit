package com.koursekit.controller;

import com.koursekit.model.AvailabilitySlot;
import com.koursekit.model.SchedulerResult;
import com.koursekit.model.SchedulerSettings;
import com.koursekit.model.StudyBlock;
import com.koursekit.model.StudyPlanEntry;
import com.koursekit.service.StudyPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    @Autowired
    private StudyPlanService studyPlanService;

    public static class ScheduleWarning {
        public final Long   entryId;
        public final String course;
        public final String taskTitle;
        public final double scheduled;
        public final double remaining;
        public final double shortfall;

        public ScheduleWarning(Long entryId, String course, String taskTitle,
                               double scheduled, double remaining) {
            this.entryId   = entryId;
            this.course    = course;
            this.taskTitle = taskTitle;
            this.scheduled = round(scheduled);
            this.remaining = round(remaining);
            this.shortfall = round(Math.max(0, remaining - scheduled));
        }

        private static double round(double v) {
            return Math.round(v * 10.0) / 10.0;
        }
    }

    public static class PlanResponse {
        public final Map<DayOfWeek, List<StudyBlock>> weeklyView;
        public final List<ScheduleWarning>            warnings;

        public PlanResponse(Map<DayOfWeek, List<StudyBlock>> weeklyView,
                            List<ScheduleWarning> warnings) {
            this.weeklyView = weeklyView;
            this.warnings   = warnings;
        }
    }

    private PlanResponse buildPlanResponse(Long userId, SchedulerResult result,
                                           List<StudyPlanEntry> entries,
                                           Map<Long, Double> remainingPerEntry) {
        Map<DayOfWeek, List<StudyBlock>> weeklyView =
                studyPlanService.getWeeklyView(userId, LocalDate.now());

        Map<Long, Double> scheduledHours = result.getScheduledHoursPerEntry();

        List<ScheduleWarning> warnings = new ArrayList<>();
        for (StudyPlanEntry entry : entries) {
            double remaining  = remainingPerEntry.getOrDefault(entry.getId(), 0.0);
            double scheduled  = scheduledHours.getOrDefault(entry.getId(), 0.0);
            if (remaining - scheduled > 0.25) {
                String course    = entry.getTask() != null ? entry.getTask().getCourse()  : "";
                String taskTitle = entry.getTask() != null ? entry.getTask().getTitle()   : "";
                warnings.add(new ScheduleWarning(entry.getId(), course, taskTitle, scheduled, remaining));
            }
        }

        return new PlanResponse(weeklyView, warnings);
    }

    @PostMapping("/{userId}/generate")
    public ResponseEntity<PlanResponse> generatePlan(
            @PathVariable Long userId,
            @RequestBody SchedulerSettings settings) {

        List<StudyPlanEntry> entriesBefore = studyPlanService.getActiveEntries(userId);
        Map<Long, Double> remainingPerEntry = new HashMap<>();
        for (StudyPlanEntry e : entriesBefore) {
            remainingPerEntry.put(e.getId(), e.getEstimatedWorkload());
        }

        SchedulerResult result = studyPlanService.generatePlan(userId, settings);
        return ResponseEntity.ok(buildPlanResponse(userId, result, entriesBefore, remainingPerEntry));
    }

    @PostMapping("/{userId}/rebalance")
    public ResponseEntity<PlanResponse> rebalance(
            @PathVariable Long userId,
            @RequestBody SchedulerSettings settings) {

        List<StudyPlanEntry> entriesBefore = studyPlanService.getActiveEntries(userId);
        Map<Long, Double> remainingPerEntry = new HashMap<>();
        for (StudyPlanEntry e : entriesBefore) {
            double rem = Math.max(0, e.getEstimatedWorkload() - e.getCompletedHours());
            remainingPerEntry.put(e.getId(), rem);
        }

        SchedulerResult result = studyPlanService.rebalance(userId, settings);
        return ResponseEntity.ok(buildPlanResponse(userId, result, entriesBefore, remainingPerEntry));
    }

    @PostMapping("/{userId}/blocks/complete-past")
    public ResponseEntity<Map<String, Integer>> markPastBlocksDone(@PathVariable Long userId) {
        int count = studyPlanService.markPastBlocksDone(userId);
        return ResponseEntity.ok(Map.of("marked", count));
    }

    @GetMapping("/{userId}/entries")
    public ResponseEntity<List<StudyPlanEntry>> getActiveEntries(@PathVariable Long userId) {
        return ResponseEntity.ok(studyPlanService.getActiveEntries(userId));
    }

    @GetMapping("/entries/{entryId}")
    public ResponseEntity<StudyPlanEntry> getEntry(@PathVariable Long entryId) {
        return ResponseEntity.ok(studyPlanService.getEntry(entryId));
    }

    @PatchMapping("/entries/{entryId}")
    public ResponseEntity<StudyPlanEntry> updateEntry(
            @PathVariable Long entryId,
            @RequestBody StudyPlanEntry updates) {
        return ResponseEntity.ok(studyPlanService.updateEntry(entryId, updates));
    }

    @DeleteMapping("/entries/{entryId}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long entryId) {
        studyPlanService.deleteEntry(entryId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/blocks/{blockId}/complete")
    public ResponseEntity<Void> completeBlock(@PathVariable Long blockId) {
        studyPlanService.completeBlock(blockId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/blocks/{blockId}/uncomplete")
    public ResponseEntity<Void> uncompletedBlock(@PathVariable Long blockId) {
        studyPlanService.uncompletedBlock(blockId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/blocks")
    public ResponseEntity<Void> clearAllBlocks(@PathVariable Long userId) {
        studyPlanService.clearAllBlocks(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blocks/{blockId}")
    public ResponseEntity<Void> deleteBlock(@PathVariable Long blockId) {
        studyPlanService.deleteBlock(blockId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/weekly")
    public ResponseEntity<Map<DayOfWeek, List<StudyBlock>>> getWeeklyView(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(studyPlanService.getWeeklyView(userId, weekStart));
    }

    @PostMapping("/{userId}/entries/add")
    public ResponseEntity<?> createEntry(
            @PathVariable Long userId,
            @RequestParam Long taskId,
            @RequestParam double estimatedWorkload) {
        try {
            StudyPlanEntry entry = studyPlanService.createEntry(userId, taskId, estimatedWorkload);
            return ResponseEntity.status(HttpStatus.CREATED).body(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/blocks/{blockId}")
    public ResponseEntity<StudyBlock> editBlock(
            @PathVariable Long blockId,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(studyPlanService.editBlock(blockId, updates));
    }

    // Availability Slots
    @GetMapping("/{userId}/slots")
    public ResponseEntity<List<AvailabilitySlot>> getSlots(@PathVariable Long userId) {
        return ResponseEntity.ok(studyPlanService.getSlots(userId));
    }

    @PostMapping("/{userId}/slots")
    public ResponseEntity<List<AvailabilitySlot>> saveSlots(
            @PathVariable Long userId,
            @RequestBody List<Map<String, Object>> slots) {
        return ResponseEntity.ok(studyPlanService.saveSlots(userId, slots));
    }

    @DeleteMapping("/{userId}/slots")
    public ResponseEntity<Void> clearSlots(@PathVariable Long userId) {
        studyPlanService.clearSlots(userId);
        return ResponseEntity.noContent().build();
    }
}