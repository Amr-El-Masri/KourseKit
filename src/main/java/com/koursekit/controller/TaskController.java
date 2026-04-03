package com.koursekit.controller;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.model.User;
import com.koursekit.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * REST controller for task-related endpoints.
 * User identity is taken from the validated JWT — never from the URL.
 * Accepts TaskRequestDTOs and returns TaskResponseDTOs only.
 * All business logic is handled in the TaskService.
 */

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @PostMapping("/add")
    public ResponseEntity<TaskResponseDTO> addTask(@RequestBody TaskRequestDTO dto) {
        TaskResponseDTO saved = taskService.addTask(currentUserId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/delete/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(currentUserId(), taskId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/edit/{taskId}")
    public ResponseEntity<TaskResponseDTO> editTask(
            @PathVariable Long taskId,
            @RequestBody TaskRequestDTO dto) {
        TaskResponseDTO saved = taskService.editTask(currentUserId(), taskId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/list-all")
    public ResponseEntity<List<TaskResponseDTO>> listAll(@RequestParam(required = false) String semester) {
        return ResponseEntity.ok(taskService.listByOrderByDeadline(currentUserId(), semester));
    }

    @GetMapping("/list")
    public ResponseEntity<List<TaskResponseDTO>> listByCourse(
            @RequestParam String course,
            @RequestParam(required = false) String semester) {
        return ResponseEntity.ok(taskService.listByCourse(currentUserId(), course, semester));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TaskResponseDTO>> searchTasks(
            @RequestParam String keyword,
            @RequestParam(required = false) String semester) {
        return ResponseEntity.ok(taskService.searchTasks(currentUserId(), keyword, semester));
    }
}