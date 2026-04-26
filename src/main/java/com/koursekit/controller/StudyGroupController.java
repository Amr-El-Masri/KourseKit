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
import com.koursekit.repository.StudyGroupMemberRepo;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/study-groups")
public class StudyGroupController {

    private final StudyGroupService studyGroupService;
    private final StudyGroupMapper studyGroupMapper;
    private final StudyGroupMemberRepo memberRepo;

    public StudyGroupController(StudyGroupService studyGroupService, StudyGroupMapper studyGroupMapper, StudyGroupMemberRepo memberRepo) {
        this.studyGroupService = studyGroupService;
        this.studyGroupMapper = studyGroupMapper;
        this.memberRepo = memberRepo; }

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
            return ResponseEntity.noContent().build(); // 204 instead of 200
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/join/private")
    public ResponseEntity<?> joinPrivateGroup(@RequestParam String inviteCode) {
        try {
            studyGroupService.joinPrivateGroup(inviteCode, currentUserId());
            return ResponseEntity.noContent().build(); // 204 instead of 200
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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
            List<com.koursekit.model.StudyGroupMember> memberships = studyGroupService.getMembershipsForUser(userId);
            List<Long> ids = memberships.stream().map(m -> m.getStudyGroup().getId()).toList();
            Map<Long, Integer> counts = studyGroupService.getMemberCounts(ids);
            List<StudyGroupResponseDTO> response = memberships.stream()
                .map(m -> studyGroupMapper.toResponseDTO(
                    m.getStudyGroup(),
                    counts.getOrDefault(m.getStudyGroup().getId(), 0),
                    m.getRole() == com.koursekit.model.StudyGroupMember.Role.HOST
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

    @DeleteMapping("/{groupId}/remove-member/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        try {
            studyGroupService.removeMember(currentUserId(), groupId, memberId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PatchMapping("/{groupId}/assign-host/{memberId}")
    public ResponseEntity<?> assignHost(@PathVariable Long groupId, @PathVariable Long memberId) {
        try {
            studyGroupService.assignHost(currentUserId(), groupId, memberId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @PatchMapping("/{groupId}/my-tag")
    public ResponseEntity<?> updateMyTag(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        Long userId = currentUserId();
        List<StudyGroupMember> members = memberRepo.findByStudyGroup_IdAndUser_Id(groupId, userId);
        if (members.isEmpty()) return ResponseEntity.status(403).build();
        StudyGroupMember m = members.get(0);
        String tag = body.get("tag");
        m.setTag(tag != null && tag.isBlank() ? null : tag);
        memberRepo.save(m);
        return ResponseEntity.ok(studyGroupMapper.toMemberResponseDTO(m));
    }

    @PatchMapping("/{groupId}/rename")
    public ResponseEntity<?> renameGroup(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        try {
            StudyGroup updated = studyGroupService.renameGroup(currentUserId(), groupId, body.get("name"));
            int memberCount = studyGroupService.getMemberCount(groupId);
            return ResponseEntity.ok(studyGroupMapper.toResponseDTO(updated, memberCount, true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        try {
            studyGroupService.deleteGroup(currentUserId(), groupId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    }
}
    
