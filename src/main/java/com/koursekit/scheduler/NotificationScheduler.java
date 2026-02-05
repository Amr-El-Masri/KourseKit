package com.koursekit.scheduler;

import com.koursekit.entity.Task;
import com.koursekit.repository.NotificationRepository;
import com.koursekit.service.NotificationService;
import com.koursekit.service.TaskService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Scheduled service that checks every ten minutes tasks for upcoming deadlines.
 * Automatically creates notifications for tasks due soon.
 * Runs internally and is not exposed to the frontend.
 */

@Service
@EnableScheduling
public class NotificationScheduler {
    private final NotificationService notificationService;
    private final TaskService taskService;
    private final NotificationRepository notificationRepository;

    public NotificationScheduler(NotificationService notificationService, TaskService taskService, NotificationRepository notificationRepository){
        this.notificationService=notificationService;
        this.taskService=taskService;
        this.notificationRepository = notificationRepository;

    }

    @Scheduled(fixedRate=600000)
    public void CreateDeadlineNotifications(){
        List<Task> tasks= taskService.findByDeadlineBetween();
        for (Task task: tasks){
           if (!notificationRepository.existsByTask_Id(task.getId())){
                String message= task.getCourse()+": "+task.getTitle()+" is due on "+ task.getDeadline();
                notificationService.createNotification(task, message);
           }
        }
    }

    @Scheduled(fixedRate=600000)
    public void removeNotifications(){
        notificationRepository.deleteOlderThan(LocalDateTime.now().minusHours(24));
    }
}
