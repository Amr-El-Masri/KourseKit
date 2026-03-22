package com.koursekit.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;

import com.koursekit.dto.StudyGroupResponseDTO;
import com.koursekit.mappers.StudyGroupMapper;
import com.koursekit.dto.StudyGroupRequestDTO;
import com.koursekit.model.User;
import com.koursekit.service.StudyGroupService;
import java.util.List;
import com.koursekit.model.StudyGroup;
import java.util.Map;
import com.koursekit.dto.StudyGroupMemberResponseDTO;
import com.koursekit.model.StudyGroupMember;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/study-groups")
public class StudyGroupController {

    private final StudyGroupService studyGroupService;
    private final StudyGroupMapper studyGroupMapper;

    public StudyGroupController(StudyGroupService studyGroupService, StudyGroupMapper studyGroupMapper) {
        this.studyGroupService = studyGroupService;
        this.studyGroupMapper = studyGroupMapper; }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody StudyGroupRequestDTO dto) {
        try {
            StudyGroup saved = studyGroupService.createGroup(currentUserId(), dto.name(), dto.courseCode(), dto.isPrivate(), dto.maxMembers());
            StudyGroupResponseDTO response = studyGroupMapper.toResponseDTO(saved, 1, true);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<?> joinPublicGroup(@PathVariable Long groupId) {
        try {
            studyGroupService.joinPublicGroup(currentUserId(), groupId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PostMapping("/join/private")
    public ResponseEntity<?> joinPrivateGroup(@RequestParam String inviteCode) {
        try {
            studyGroupService.joinPrivateGroup(inviteCode, currentUserId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long groupId) {
        try {
            studyGroupService.leaveGroup(currentUserId(), groupId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @GetMapping("/course/{courseCode}")
    public ResponseEntity<?> groupsForCourse(@PathVariable String courseCode) {
        try {
            List<StudyGroup> groups = studyGroupService.getGroupsForCourse(courseCode);
            List<Long> ids = groups.stream().map(StudyGroup::getId).toList();
            Map<Long, Integer> counts = studyGroupService.getMemberCounts(ids);
            List<StudyGroupResponseDTO> response = groups.stream()
                .map(g -> studyGroupMapper.toResponseDTO(g, counts.getOrDefault(g.getId(), 0), false))
                .toList();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-groups")
    public ResponseEntity<?> myGroups() {
        try {
            Long userId = currentUserId();
            List<StudyGroup> groups = studyGroupService.getGroupsForUser(userId);
            List<Long> ids = groups.stream().map(StudyGroup::getId).toList();
            Map<Long, Integer> counts = studyGroupService.getMemberCounts(ids);
            List<StudyGroupResponseDTO> response = groups.stream()
                .map(g -> studyGroupMapper.toResponseDTO(
                    g,
                    counts.getOrDefault(g.getId(), 0),
                    g.getHost().getId().equals(userId)
                ))
                .toList();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> groupMembersList(@PathVariable Long groupId) {
        try {
            List<StudyGroupMemberResponseDTO> list = studyGroupService.getMembers(groupId)
                .stream()
                .map(studyGroupMapper::toMemberResponseDTO)
                .toList();
        return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }
}
