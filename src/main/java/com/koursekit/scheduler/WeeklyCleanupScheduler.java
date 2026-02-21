package com.koursekit.scheduler;

import com.koursekit.model.StudyPlanEntry;
import com.koursekit.model.Task;
import com.koursekit.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class WeeklyCleanupScheduler {

    private final TaskRepository taskRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final StudyBlockRepository studyBlockRepository;
    private final NotificationRepository notificationRepository;

    public WeeklyCleanupScheduler(
            TaskRepository taskRepository,
            StudyPlanRepository studyPlanRepository,
            StudyBlockRepository studyBlockRepository,
            NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.studyPlanRepository = studyPlanRepository;
        this.studyBlockRepository = studyBlockRepository;
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(cron = "0 0 0 * * SUN")
    @Transactional
    public void weeklyCleanup() {
        LocalDateTime now = LocalDateTime.now();

        // delete all blocks first
        List<StudyPlanEntry> allEntries = studyPlanRepository.findAll();
        for (StudyPlanEntry entry : allEntries) {
            studyBlockRepository.deleteAll(
                    studyBlockRepository.findByStudyPlanEntry(entry)
            );
        }

        //delete all study plan entries
        studyPlanRepository.deleteAll(allEntries);

        //per user, delete overdue tasks and their notifications
        List<Long> affectedUserIds = taskRepository.findDistinctUserIdsWithExpiredTasks(now);

        for (Long userId : affectedUserIds) {
            List<Task> expiredTasks = taskRepository.findByUserIdAndDeadlineBefore(userId, now);

            for (Task task : expiredTasks) {
                // Delete notifications first
                notificationRepository.deleteByTask_Id(task.getId());
                taskRepository.delete(task);
            }
        }
    }
}