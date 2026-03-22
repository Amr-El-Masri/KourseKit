package com.koursekit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public record StudyGroupRequestDTO (
    @NotBlank String name,
    @NotNull String courseCode,
    @NotNull Boolean isPrivate,
    @Min(2) int maxMembers

) {}
