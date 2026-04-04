package com.koursekit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GroupReportsRequestDTO (
    @NotNull Long messageId,
    @NotNull Long reportedUserId,
    @NotBlank String reason,
    @NotNull Long studyGroupId
) {}
