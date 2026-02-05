package com.koursekit.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
        String message,
        LocalDateTime createdAt
        ) {
}
