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
        LocalDateTime tomorrowStart  = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime dayAfterStart  = now.toLocalDate().plusDays(2).atStartOfDay();
        LocalDateTime day3Start      = now.toLocalDate().plusDays(3).atStartOfDay();

        // Purge notifications that no longer match their task's current deadline
        // (covers: deadline changed, task completed, deadline moved outside all windows)
        notificationRepository.deleteStaleNotifications(
            now,
            tomorrowStart,
            dayAfterStart,
            day3Start
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

        // Today: due any time remaining today (now → midnight tonight)
        List<Task> todayTasks = taskService.findByDeadlineBetween(now, tomorrowStart);
        for (Task task : todayTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "today");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "today")) {
                notificationService.createNotification(task, "today");
            }
        }

        // Tomorrow: due any time on the next calendar day (midnight tonight → midnight day after)
        List<Task> tomorrowTasks = taskService.findByDeadlineBetween(tomorrowStart, dayAfterStart);
        for (Task task : tomorrowTasks) {
            if (task.isCompleted()) continue;
            notificationRepository.deleteByTask_IdAndUrgencyNot(task.getId(), "tomorrow");
            if (!notificationRepository.existsByTask_IdAndUrgency(task.getId(), "tomorrow")) {
                notificationService.createNotification(task, "tomorrow");
            }
        }

        // 3 days: due any time on the calendar day 2 days from now (midnight day after → midnight day+3)
        List<Task> threeDayTasks = taskService.findByDeadlineBetween(dayAfterStart, day3Start);
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