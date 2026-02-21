package com.koursekit.scheduler;

import com.koursekit.repository.TaskRepository;
import com.koursekit.service.TaskService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Runs every minute to delete overdue tasks NOT linked to a study plan.
 * Tasks in a study plan are skipped here and handled by WeeklyCleanupScheduler.
 * Processes each user independently.
 */

@Component("taskCleanupScheduler")
@EnableScheduling
public class TaskCleanupScheduler {

    private final TaskService taskService;
    private final TaskRepository taskRepository;

    public TaskCleanupScheduler(TaskService taskService, TaskRepository taskRepository) {
        this.taskService = taskService;
        this.taskRepository = taskRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void removeOverdueTasks() {
        List<Long> affectedUserIds = taskRepository.findDistinctUserIdsWithExpiredTasks(LocalDateTime.now());

        for (Long userId : affectedUserIds) {
            taskService.deleteOverdueTasks(userId);
        }
    }
}