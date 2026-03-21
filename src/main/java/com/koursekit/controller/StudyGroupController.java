package com.koursekit.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;

import com.koursekit.dto.StudyGroupResponseDTO;
import com.koursekit.dto.StudyGroupRequestDTO;
import com.koursekit.model.User;
import com.koursekit.service.StudyGroupService;
import java.util.List;

@RestController
@RequestMapping("/api/study-groups")
public class StudyGroupController {

    private final StudyGroupService studyGroupService;

    public StudyGroupController(StudyGroupService studyGroupService) {
        this.studyGroupService = studyGroupService; }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @PostMapping("/create")
    public ResponseEntity<StudyGroupResponseDTO> createGroup(@RequestBody StudyGroupRequestDTO dto) {
        StudyGroupResponseDTO created = studyGroupService.createGroup(currentUserId(), dto.getName(), dto.getCourseId(), dto.isPrivate(), dto.getMaxMembers());
        return ResponseEntity.status(HttpStatus.CREATED).body(created); }

    
}
