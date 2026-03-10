package com.koursekit.scheduler;

import com.koursekit.model.Task;
import com.koursekit.repository.NotificationRepository;
import com.koursekit.service.NotificationService;
import com.koursekit.service.TaskService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@EnableScheduling
public class NotificationScheduler {

    private final NotificationService notificationService;
    private final TaskService taskService;
    private final NotificationRepository notificationRepository;

    private static final int DEDUP_HOURS = 6;

    public NotificationScheduler(NotificationService notificationService,
                                 TaskService taskService,
                                 NotificationRepository notificationRepository) {
        this.notificationService = notificationService;
        this.taskService = taskService;
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void createDeadlineNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // Today: due within 6 hours
        List<Task> todayTasks = taskService.findByDeadlineBetween(now, now.plusHours(6));
        for (Task task : todayTasks) {
            if (!notificationRepository.existsByTask_IdAndCreatedAtAfter(task.getId(), now.minusHours(DEDUP_HOURS))) {
                notificationService.createNotification(task, "");
            }
        }

        // Tomorrow: due between 6h and 48h from now
        List<Task> tomorrowTasks = taskService.findByDeadlineBetween(now.plusHours(6), now.plusHours(48));
        for (Task task : tomorrowTasks) {
            if (!notificationRepository.existsByTask_IdAndCreatedAtAfter(task.getId(), now.minusHours(DEDUP_HOURS))) {
                notificationService.createNotification(task, "");
            }
        }

        // 3 days: due between 48h and 78h from now
        List<Task> threeDayTasks = taskService.findByDeadlineBetween(now.plusHours(48), now.plusHours(78));
        for (Task task : threeDayTasks) {
            if (!notificationRepository.existsByTask_IdAndCreatedAtAfter(task.getId(), now.minusHours(DEDUP_HOURS))) {
                notificationService.createNotification(task, "");
            }
        }
    }

    @Scheduled(fixedRate = 600000)
    public void removeStaleNotifications() {
        // Keep notifications for 96 hours so 3-day ones don't get deleted prematurely
        notificationRepository.deleteOlderThan(LocalDateTime.now().minusHours(96));
    }
}