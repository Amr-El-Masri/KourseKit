package com.koursekit.dto;

import com.koursekit.model.GroupReport;
import java.time.LocalDateTime;

public record GroupReportsResponseDTO(
    Long id,
    Long groupId,
    Long reportedByUserId,
    String reportedByFirstName,
    String reportedByLastName,
    Long reportedUserId,
    String reportedUserFirstName,
    String reportedUserLastName,
    Long messageId,
    String reason,
    GroupReport.Status status,
    LocalDateTime createdAt
){}
