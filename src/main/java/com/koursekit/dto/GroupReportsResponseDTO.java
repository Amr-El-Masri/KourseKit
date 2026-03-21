package com.koursekit.dto;

import com.koursekit.model.GroupReport;
import java.time.LocalDateTime;

public record GroupReportsResponseDTO(
    Long id,
    Long groupId,
    Long reportedByUserId,
    String reportedByName,
    Long reportedUserId,
    String reportedName,
    Long messageId,
    String reason,
    GroupReport.Status status,
    LocalDateTime createdAt
){}
