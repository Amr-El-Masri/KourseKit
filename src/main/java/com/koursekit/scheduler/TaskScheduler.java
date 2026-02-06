package com.koursekit.scheduler;

import com.koursekit.service.TaskService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Component
@EnableScheduling
public class TaskScheduler {

        private final TaskService taskService;

        public TaskScheduler(TaskService taskService) {
            this.taskService = taskService;
        }


        @Scheduled(fixedrate=60000)
        public void removeOverdueTasks() {
            taskService.deleteOverdueTasks();
        }

}
