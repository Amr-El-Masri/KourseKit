package com.koursekit.scheduler;

import com.koursekit.service.TaskService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component("taskCleanupScheduler")
@EnableScheduling
public class TaskCleanupScheduler {

        private final TaskService taskService;

        public TaskCleanupScheduler(TaskService taskService) {
            this.taskService = taskService;
        }


        @Scheduled(fixedRate = 60000)
        public void removeOverdueTasks() {
            taskService.deleteOverdueTasks();
        }

}
