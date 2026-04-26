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

    public NotificationScheduler(NotificationService notificationService,
                                 TaskService taskService,
                                 NotificationRepository notificationRepository) {
        this.notificationService = notificationService;
        this.taskService = taskService;
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(fixedRate = 10000)
    public void createDeadlineNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // Purge notifications that no longer match their task's current deadline
        // (covers: deadline changed, task completed, deadline moved outside all windows)
        notificationRepository.deleteStaleNotifications(
            now,
            now.plusHours(6),
            now.plusHours(48),
            now.plusHours(78)
        );

        // Overdue: deadline has already passed, task not completed
        List<Task> overdueTasks = taskService.findByDeadlineBetween(now.minusYears(1), now);
        for (Task task : overdueTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "overdue");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "overdue")) {
                notificationService.createNotification(task, "overdue");
            }
        }

        // Today: due within 6 hours
        List<Task> todayTasks = taskService.findByDeadlineBetween(now, now.plusHours(6));
        for (Task task : todayTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "today");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "today")) {
                notificationService.createNotification(task, "today");
            }
        }

        // Tomorrow: due between 6h and 48h from now
        List<Task> tomorrowTasks = taskService.findByDeadlineBetween(now.plusHours(6), now.plusHours(48));
        for (Task task : tomorrowTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "tomorrow");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "tomorrow")) {
                notificationService.createNotification(task, "tomorrow");
            }
        }

        // 3 days: due between 48h and 78h from now
        List<Task> threeDayTasks = taskService.findByDeadlineBetween(now.plusHours(48), now.plusHours(78));
        for (Task task : threeDayTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "3day");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "3day")) {
                notificationService.createNotification(task, "3day");
            }
        }
    }

    @Scheduled(fixedRate = 600000)
    public void removeStaleNotifications() {
        // Non-overdue notifications expire after 24h. Overdue ones persist until the task is completed.
        notificationRepository.deleteOlderThanAndNotOverdue(LocalDateTime.now().minusHours(24));
    }
}