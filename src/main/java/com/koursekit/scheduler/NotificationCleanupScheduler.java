package com.koursekit.scheduler;

import com.koursekit.repository.NotificationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    public NotificationCleanupScheduler(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(fixedRate = 6000)
    public void deleteOverdueNotifications() {
        notificationRepository.deleteAllOverdue(LocalDateTime.now());
    }
}