package com.koursekit.dto;

import jakarta.validation.constraints.NotBlank;

public record GroupMessageRequestDTO (
    @NotBlank String content
) {}