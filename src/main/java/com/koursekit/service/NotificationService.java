package com.koursekit.service;

import com.koursekit.dto.NotificationDTO;
import com.koursekit.model.Notification;
import com.koursekit.model.Task;
import com.koursekit.mappers.NotificationMapper;
import com.koursekit.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationRepository notificationRepository, NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
    }

    public Notification createNotification(Task task, String urgency) {
        Notification notification = new Notification(task, "", urgency, LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    // Returns all notifications sorted by soonest deadline
    public List<NotificationDTO> getAllNotifications(Long userId) {
        return notificationRepository.findByTask_User_IdOrderByTask_DeadlineAsc(userId)
                .stream()
                .map(notificationMapper::toDto)
                .toList();
    }

    // Returns unread count for badge
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByTask_User_IdAndIsReadFalse(userId);
    }

    // Mark all notifications as read for a user
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByTask_User_IdOrderByTask_DeadlineAsc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}