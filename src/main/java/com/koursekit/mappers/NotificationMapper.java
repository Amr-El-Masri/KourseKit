package com.koursekit.mappers;

import com.koursekit.dto.NotificationDTO;
import com.koursekit.model.Notification;
import com.koursekit.model.Task;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class NotificationMapper {
    public NotificationDTO toDto(Notification notification) {
        Task task = notification.getTask();
        LocalDateTime now = LocalDateTime.now();

        long hoursUntilDeadline = ChronoUnit.HOURS.between(now, task.getDeadline());

        String urgency = hoursUntilDeadline <= 6 ? "today"
                : hoursUntilDeadline <= 30 ? "tomorrow"
                : "3day";

        // Build message fresh from current task data so edits are reflected
        String message = switch (urgency) {
            case "today" -> task.getCourse() + " — " + task.getTitle()
                    + " due in " + Duration.between(now, task.getDeadline()).toHours() + "h";
            case "tomorrow" -> task.getCourse() + " — " + task.getTitle() + " due tomorrow";
            default -> task.getCourse() + " — " + task.getTitle() + " due in 3 days";
        };

        return new NotificationDTO(
                message,
                urgency,
                notification.getCreatedAt(),
                task.getDeadline(),
                notification.isRead()
        );
    }
}