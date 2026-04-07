package com.koursekit.controller;

import com.koursekit.dto.GroupStudySessionRequestDTO;
import com.koursekit.dto.GroupStudySessionResponseDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.mappers.GroupStudySessionMapper;
import com.koursekit.mappers.TaskMapper;
import com.koursekit.model.GroupStudySession;
import com.koursekit.model.Task;
import com.koursekit.model.User;
import com.koursekit.service.GroupStudySessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/group-sessions")
public class GroupStudySessionController {
    private final GroupStudySessionService sessionService;
    private final GroupStudySessionMapper sessionMapper;
    private final TaskMapper taskMapper;

    public GroupStudySessionController(GroupStudySessionService sessionService, GroupStudySessionMapper sessionMapper, TaskMapper taskMapper) {
        this.sessionService = sessionService;
        this.sessionMapper = sessionMapper;
        this.taskMapper = taskMapper;
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @PostMapping("/{groupId}/create")
    public ResponseEntity<?> createSession(@PathVariable Long groupId, @RequestBody GroupStudySessionRequestDTO dto) {
        try {
            GroupStudySession session = sessionService.createSession(currentUserId(), groupId, dto.date(), dto.startTime(), dto.duration());
            return ResponseEntity.status(HttpStatus.CREATED).body(sessionMapper.toResponseDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<List<GroupStudySessionResponseDTO>> getSessions(@PathVariable Long groupId) {
        List<GroupStudySessionResponseDTO> list = sessionService.getSessionsForGroup(groupId)
            .stream().map(sessionMapper::toResponseDTO).toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my")
    public ResponseEntity<List<GroupStudySessionResponseDTO>> getMySessions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        List<GroupStudySessionResponseDTO> list = sessionService.getMySyncedSessionsForWeek(currentUserId(), weekStart)
            .stream().map(sessionMapper::toResponseDTO).toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{sessionId}/remove-from-planner")
    public ResponseEntity<?> removeFromPlanner(@PathVariable Long sessionId) {
        try {
            GroupStudySession session = sessionService.removeFromPlanner(sessionId, currentUserId());
            return ResponseEntity.ok(sessionMapper.toResponseDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/add-to-planner")
    public ResponseEntity<?> addToPlanner(@PathVariable Long sessionId) {
        try {
            GroupStudySession session = sessionService.addToPlanner(sessionId, currentUserId());
            return ResponseEntity.ok(sessionMapper.toResponseDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/sync")
    public ResponseEntity<?> syncToPlanner(@PathVariable Long sessionId) {
        try {
            Task task = sessionService.syncSessionToTask(sessionId, currentUserId());
            return ResponseEntity.ok(taskMapper.toDto(task));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{sessionId}")
    public ResponseEntity<?> editSession(@PathVariable Long sessionId, @RequestBody GroupStudySessionRequestDTO dto) {
        try {
            GroupStudySession session = sessionService.editSession(sessionId, currentUserId(), dto.date(), dto.startTime(), dto.duration());
            return ResponseEntity.ok(sessionMapper.toResponseDTO(session));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable Long sessionId) {
        try {
            sessionService.deleteSession(sessionId, currentUserId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}