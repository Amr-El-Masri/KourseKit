package com.koursekit.controller;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * REST controller for task-related endpoints.
 * Accepts TaskRequestDTOs and returns TaskResponseDTOs only.
 * Ensures that tasks are added, edited, deleted, and listed without exposing internal IDs.
 * All business logic is handled in the TaskService.
 */

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<TaskResponseDTO> addTask(
            @PathVariable Long userId,
            @RequestBody TaskRequestDTO dto) {

        TaskResponseDTO saved = taskService.addTask(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{userId}/delete/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long userId,
            @PathVariable Long taskId) {

        taskService.deleteTask(userId, taskId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/edit/{taskId}")
    public ResponseEntity<TaskResponseDTO> editTask(
            @PathVariable Long userId,
            @PathVariable Long taskId,
            @RequestBody TaskRequestDTO dto) {

        TaskResponseDTO saved = taskService.editTask(userId, taskId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}/list-all")
    public ResponseEntity<List<TaskResponseDTO>> listAll(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.listByOrderByDeadline(userId));
    }

    @GetMapping("/{userId}/list")
    public ResponseEntity<List<TaskResponseDTO>> listByCourse(
            @PathVariable Long userId,
            @RequestParam String course) {
        System.out.println("listByCourse called with userId=" + userId + ", course=" + course);

        return ResponseEntity.ok(taskService.listByCourse(userId, course));
    }

    @GetMapping("/{userId}/search")
    public ResponseEntity<List<TaskResponseDTO>> searchTasks(
            @PathVariable Long userId,
            @RequestParam String keyword) {

        return ResponseEntity.ok(taskService.searchTasks(userId, keyword));
    }

}
