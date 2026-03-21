package com.koursekit.dto;

import com.koursekit.model.StudyGroupMember;
import java.time.LocalDateTime;

public record StudyGroupMemberResponseDTO (
    Long userId,
    String firstName,
    String lastName,
    StudyGroupMember.Role role,
    LocalDateTime joinedAt
) {}
