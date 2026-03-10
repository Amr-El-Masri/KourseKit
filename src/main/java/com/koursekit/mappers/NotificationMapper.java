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

        String urgency = hoursUntilDeadline < 0 ? "overdue"
                : hoursUntilDeadline <= 6 ? "today"
                : hoursUntilDeadline <= 30 ? "tomorrow"
                : "3day";

        Duration timeLeft = Duration.between(now, task.getDeadline());

        String timeLeftStr = switch (urgency) {
            case "overdue"  -> null;
            case "today"    -> timeLeft.toHours() < 1 ? "very soon" : timeLeft.toHours() + "h";
            case "tomorrow" -> "tomorrow";
            default         -> "in 3 days";
        };

        String message = task.getCourse() + " — " + task.getTitle() + (
                urgency.equals("overdue") ? " is overdue" : " due " + timeLeftStr
        );

        return new NotificationDTO(
                message,
                urgency,
                notification.getCreatedAt(),
                task.getDeadline(),
                notification.isRead()
        );
    }
}