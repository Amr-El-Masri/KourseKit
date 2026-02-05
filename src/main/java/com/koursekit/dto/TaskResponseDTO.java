package com.koursekit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TaskResponseDTO(
        String course,
        String title,

        @JsonFormat(pattern = "dd-MM-yyyy HH:mm")  // day-month-year hours:minutes
        LocalDateTime deadline
) {
}
