package com.koursekit.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public record GroupStudySessionResponseDTO(
    Long id,
    Long groupId,
    String groupName,
    String courseCode,
    LocalDate date,
    LocalTime startTime,
    double duration,
    String createdByFirstName,
    String createdByLastName,
    boolean isSynced,
    LocalTime endTime
) {}
