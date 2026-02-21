package com.koursekit.service;

import com.koursekit.dto.NotificationDTO;
import com.koursekit.model.Task;
import com.koursekit.model.Notification;
import com.koursekit.mappers.NotificationMapper;
import com.koursekit.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
/*
 * Handles business logic for notifications.
 * Creates in-app notifications based on tasks and deadlines.
 * Notifications are read-only for users and are never edited manually.
 */
@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationRepository notificationRepository,NotificationMapper notificationMapper){
        this.notificationRepository=notificationRepository;
        this.notificationMapper=notificationMapper;
    }

    public Notification createNotification(Task task, String message){
        Notification notification = new Notification(task, message, LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public List<NotificationDTO> getAllNotifications(Long userId) {
        return notificationRepository.findByTask_User_Id(userId)
                .stream()
                .map(notificationMapper::toDto)
                .toList();
    }


}
