package com.koursekit.mappers;

import com.koursekit.dto.NotificationDTO;
import com.koursekit.entity.Notification;
import org.springframework.stereotype.Component;

/*
 * Maps Notification entities to NotificationDtos.
 * Centralizes mapping logic to avoid duplication.
 * Only exposes fields relevant to the frontend (message and createdAt).
 */

@Component
public class NotificationMapper {
    public  NotificationDTO toDto(Notification notification){
        return new NotificationDTO(notification.getMessage(), notification.getCreatedAt());
    }
}
