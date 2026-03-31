package com.koursekit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.koursekit.model.Task;

import java.time.LocalDateTime;

public record TaskResponseDTO(
        Long id,
        String course,
        String title,
        String type,
        String notes,
        Task.Priority priority,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        LocalDateTime deadline,
        boolean completed,
        boolean fromSyllabus,
        String semesterName
) {
}