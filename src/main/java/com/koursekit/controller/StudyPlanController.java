package com.koursekit.controller;

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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    @Autowired
    private StudyPlanService studyPlanService;

    @PostMapping("/{userId}/generate")
    public ResponseEntity<Map<DayOfWeek, List<StudyBlock>>> generatePlan(
            @PathVariable Long userId,
            @RequestBody SchedulerSettings settings) {

        Map<DayOfWeek, List<StudyBlock>> weeklyView = studyPlanService.generatePlan(userId, settings);
        return ResponseEntity.ok(weeklyView);
    }

    @PostMapping("/{userId}/rebalance")
    public ResponseEntity<Map<DayOfWeek, List<StudyBlock>>> rebalance(
            @PathVariable Long userId,
            @RequestBody SchedulerSettings settings) {

        Map<DayOfWeek, List<StudyBlock>> weeklyView = studyPlanService.rebalance(userId, settings);
        return ResponseEntity.ok(weeklyView);
    }

    @GetMapping("/{userId}/entries")
    public ResponseEntity<List<StudyPlanEntry>> getActiveEntries(@PathVariable Long userId) {
        List<StudyPlanEntry> entries = studyPlanService.getActiveEntries(userId);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/entries/{entryId}")
    public ResponseEntity<StudyPlanEntry> getEntry(@PathVariable Long entryId) {
        StudyPlanEntry entry = studyPlanService.getEntry(entryId);
        return ResponseEntity.ok(entry);
    }

    @PatchMapping("/entries/{entryId}")
    public ResponseEntity<StudyPlanEntry> updateEntry(
            @PathVariable Long entryId,
            @RequestBody StudyPlanEntry updates) {

        StudyPlanEntry updated = studyPlanService.updateEntry(entryId, updates);
        return ResponseEntity.ok(updated);
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

    @DeleteMapping("/blocks/{blockId}")
    public ResponseEntity<Void> deleteBlock(@PathVariable Long blockId) {
        studyPlanService.deleteBlock(blockId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/weekly")
    public ResponseEntity<Map<DayOfWeek, List<StudyBlock>>> getWeeklyView(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {

        Map<DayOfWeek, List<StudyBlock>> weeklyView = studyPlanService.getWeeklyView(userId, weekStart);
        return ResponseEntity.ok(weeklyView);
    }

    @PostMapping("/{userId}/entries/add")
    public ResponseEntity<StudyPlanEntry> createEntry(
            @PathVariable Long userId,
            @RequestParam Long taskId,
            @RequestParam double estimatedWorkload) {

        StudyPlanEntry entry = studyPlanService.createEntry(userId, taskId, estimatedWorkload);
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }

    @PatchMapping("/blocks/{blockId}")
    public ResponseEntity<StudyBlock> editBlock(
            @PathVariable Long blockId,
            @RequestBody Map<String, Object> updates) {

        StudyBlock updated = studyPlanService.editBlock(blockId, updates);
        return ResponseEntity.ok(updated);
    }

}