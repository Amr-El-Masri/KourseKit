package com.koursekit.controller;

import com.koursekit.model.AvailabilitySlot;
import com.koursekit.model.SchedulerResult;
import com.koursekit.model.SchedulerSettings;
import com.koursekit.model.StudyBlock;
import com.koursekit.model.StudyPlanEntry;
import com.koursekit.model.User;
import com.koursekit.service.StudyPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    @Autowired
    private StudyPlanService studyPlanService;

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

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
                                           Map<Long, Double> remainingPerEntry,
                                           LocalDate weekStart) {
        Map<DayOfWeek, List<StudyBlock>> weeklyView =
                studyPlanService.getWeeklyView(userId, weekStart);

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

    @PostMapping("/generate")
    public ResponseEntity<PlanResponse> generatePlan(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestBody SchedulerSettings settings) {

        Long userId = currentUserId();
        List<StudyPlanEntry> entriesBefore = studyPlanService.getActiveEntries(userId, weekStart);
        Map<Long, Double> remainingPerEntry = new HashMap<>();
        for (StudyPlanEntry e : entriesBefore) {
            remainingPerEntry.put(e.getId(), e.getEstimatedWorkload());
        }

        SchedulerResult result = studyPlanService.generatePlan(userId, settings, weekStart);
        return ResponseEntity.ok(buildPlanResponse(userId, result, entriesBefore, remainingPerEntry, weekStart));
    }

    @PostMapping("/rebalance")
    public ResponseEntity<PlanResponse> rebalance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestBody SchedulerSettings settings) {

        Long userId = currentUserId();
        List<StudyPlanEntry> entriesBefore = studyPlanService.getActiveEntries(userId, weekStart);
        Map<Long, Double> remainingPerEntry = new HashMap<>();
        for (StudyPlanEntry e : entriesBefore) {
            double rem = Math.max(0, e.getEstimatedWorkload() - e.getCompletedHours());
            remainingPerEntry.put(e.getId(), rem);
        }

        studyPlanService.rebalance(userId, settings, weekStart);
        SchedulerResult result = new SchedulerResult(new ArrayList<>(), new ArrayList<>());
        return ResponseEntity.ok(buildPlanResponse(userId, result, entriesBefore, remainingPerEntry, weekStart));
    }

    @PostMapping("/blocks/complete-past")
    public ResponseEntity<Map<String, Integer>> markPastBlocksDone() {
        int count = studyPlanService.markPastBlocksDone(currentUserId());
        return ResponseEntity.ok(Map.of("marked", count));
    }

    @GetMapping("/entries")
    public ResponseEntity<List<StudyPlanEntry>> getActiveEntries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(studyPlanService.getActiveEntries(currentUserId(), weekStart));
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

    @DeleteMapping("/blocks")
    public ResponseEntity<Void> clearAllBlocks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        studyPlanService.clearBlocksByWeek(currentUserId(), weekStart);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blocks/{blockId}")
    public ResponseEntity<Void> deleteBlock(@PathVariable Long blockId) {
        studyPlanService.deleteBlock(blockId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/weekly")
    public ResponseEntity<Map<DayOfWeek, List<StudyBlock>>> getWeeklyView(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(studyPlanService.getWeeklyView(currentUserId(), weekStart));
    }

    @PostMapping("/entries/add")
    public ResponseEntity<?> createEntry(
            @RequestParam Long taskId,
            @RequestParam double estimatedWorkload,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        try {
            StudyPlanEntry entry = studyPlanService.createEntry(currentUserId(), taskId, estimatedWorkload, weekStart);
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

    @GetMapping("/slots")
    public ResponseEntity<List<AvailabilitySlot>> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(studyPlanService.getSlots(currentUserId(), weekStart));
    }

    @PostMapping("/slots")
    public ResponseEntity<List<AvailabilitySlot>> saveSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestBody List<Map<String, Object>> slots) {
        return ResponseEntity.ok(studyPlanService.saveSlots(currentUserId(), weekStart, slots));
    }

    @DeleteMapping("/slots")
    public ResponseEntity<Void> clearSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        studyPlanService.clearSlots(currentUserId(), weekStart);
        return ResponseEntity.noContent().build();
    }
}