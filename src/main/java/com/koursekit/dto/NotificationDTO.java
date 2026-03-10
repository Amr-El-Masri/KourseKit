package com.koursekit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record NotificationDTO(
        String message,
        String urgency,
        @JsonFormat(pattern = "dd-MM-yyyy HH:mm") LocalDateTime createdAt,
        @JsonFormat(pattern = "dd-MM-yyyy HH:mm") LocalDateTime taskDeadline,
        boolean isRead
) {}