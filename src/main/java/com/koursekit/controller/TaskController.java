package com.koursekit.controller;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.entity.Task;
import com.koursekit.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * REST controller for task-related endpoints.
 * Accepts TaskRequestDTOs and returns TaskResponseDTOs only.
 * Ensures that tasks are added, edited, deleted, and listed without exposing internal IDs.
 * All business logic is handled in the TaskService.
 */

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/add")
    public ResponseEntity<TaskResponseDTO> addTask(@RequestBody TaskRequestDTO dto){
        TaskResponseDTO saved = taskService.addTask(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);

    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id){
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();

    }
    @PatchMapping("/edit/{id}")
    public ResponseEntity<TaskResponseDTO> editTask(@PathVariable Long id, @RequestBody TaskRequestDTO dto){
        TaskResponseDTO saved= taskService.editTask(id, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/list-all")
    public ResponseEntity<List<TaskResponseDTO>> listAll(){
        return ResponseEntity.ok(taskService.listByOrderByDeadline());

    }
    @GetMapping("/list")
    public ResponseEntity<List<TaskResponseDTO>> listByCourse(@RequestParam String course){
        return ResponseEntity.ok(taskService.listByCourse(course));

    }

}
