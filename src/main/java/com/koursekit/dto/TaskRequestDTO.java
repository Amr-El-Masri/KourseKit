package com.koursekit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TaskRequestDTO(
        @NotBlank String course,
        @NotBlank String title,
        String type,
        String notes,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        @NotNull LocalDateTime deadline,
        boolean completed,
        boolean fromSyllabus,
        boolean allowPastDeadline,
        String semesterName
) {
}