package com.koursekit.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public record GroupStudySessionResponseDTO(
    Long id,
    Long groupId,
    LocalDate date,
    LocalTime startTime,
    double duration,
    String createdByName,
    boolean isSynced,
    LocalDateTime createdAt
) {}
