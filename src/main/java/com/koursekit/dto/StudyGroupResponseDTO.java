package com.koursekit.dto;

public record StudyGroupResponseDTO (
    Long id,
    String name,
    String courseName,
    Long courseId,
    String hostFirstName,
    String hostLastName,
    boolean isPrivate,
    Integer maxMembers,
    int memberCount,
    String inviteCode
) {}
