package com.koursekit.scheduler;

import org.springframework.stereotype.Component;

@Component
public class NotificationCleanupScheduler {
    // Overdue notifications are cleaned up by the 96h stale cleanup in NotificationScheduler
}
