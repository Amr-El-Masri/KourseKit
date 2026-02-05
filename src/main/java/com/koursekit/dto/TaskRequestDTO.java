package com.koursekit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TaskRequestDTO(
         @NotBlank String course,
         @NotBlank String title,

         @JsonFormat(pattern = "dd-MM-yyyy HH:mm")  // day-month-year hours:minutes
         @NotNull LocalDateTime deadline
) {
}
