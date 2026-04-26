package com.koursekit.scheduler;

import com.koursekit.model.Task;
import com.koursekit.model.User;
import com.koursekit.repository.TaskRepository;
import com.koursekit.repository.UserRepo;
import com.koursekit.service.TaskService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DeadlineEmailScheduler {

    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final UserRepo userRepository;

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    @Value("${RESEND_FROM_EMAIL:KourseKit <onboarding@resend.dev>}")
    private String fromEmail;

    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final int DEDUP_HOURS = 6;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm");

    public DeadlineEmailScheduler(TaskService taskService,
                                  TaskRepository taskRepository,
                                  UserRepo userRepository) {
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void sendDeadlineEmails() {
        LocalDateTime now = LocalDateTime.now();

        List<Task> urgentTasks = taskService.findByDeadlineBetween(now, now.plusHours(6));
        if (urgentTasks.isEmpty()) return;

        List<Long> userIds = urgentTasks.stream().map(Task::getUserId).distinct().toList();
        Map<Long, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        for (Task task : urgentTasks) {
            User user = userMap.get(task.getUserId());
            if (user == null || !user.isEmailRemindersEnabled()) continue;
            LocalDateTime lastSent = task.getEmailSentAt();
            if (lastSent == null || lastSent.isBefore(now.minusHours(DEDUP_HOURS))) {
                sendEmail(user, task);
                task.setEmailSentAt(now);
                taskRepository.save(task);
            }
        }
    }

    private void sendEmail(User user, Task task) {
        String toEmail = user.getEmail();
        String firstName = user.getFirstName();
        String name = (firstName != null && !firstName.isBlank()) ? firstName : "Student";

        String subject = "Reminder: " + task.getCourse() + " — " + task.getTitle() + " is due soon";
        String deadlineStr = task.getDeadline().format(FMT);

        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Deadline Reminder</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi <strong>%s</strong>,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  This is a reminder that your task is due <strong>very soon</strong>:
                </p>
                <div style="background: #f0f0f8; border-left: 4px solid #5a3e8a; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
                  <div style="font-size: 12px; color: #7a6aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">%s</div>
                  <div style="font-size: 16px; font-weight: 700; color: #1f3060;">%s</div>
                  <div style="font-size: 13px; color: #666; margin-top: 6px;">Due: %s</div>
                </div>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">Good luck! — The KourseKit Team</p>
              </div>
            </div>
            """.formatted(name, task.getCourse(), task.getTitle(), deadlineStr);

        try {
            String escaped = html
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");

            String subjectEscaped = subject.replace("\"", "\\\"");
            String body = "{\"from\":\"" + fromEmail + "\","
                + "\"to\":[\"" + toEmail + "\"],"
                + "\"subject\":\"" + subjectEscaped + "\","
                + "\"html\":\"" + escaped + "\"}";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                System.err.println("Resend error " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Failed to send deadline email to " + toEmail + ": " + e.getMessage());
        }
    }
}
