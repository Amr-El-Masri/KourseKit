package com.koursekit.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record GroupStudySessionRequestDTO (
    @NotNull LocalDate date,
    @NotNull LocalTime startTime,
    @NotNull double duration,
    @NotNull LocalTime endTime
) {}
