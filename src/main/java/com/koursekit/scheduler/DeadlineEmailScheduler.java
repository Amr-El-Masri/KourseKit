package com.koursekit.scheduler;

import com.koursekit.model.Task;
import com.koursekit.model.User;
import com.koursekit.repository.UserRepo;
import com.koursekit.service.TaskService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class DeadlineEmailScheduler {

    private final TaskService taskService;
    private final UserRepo userRepository;
    private final JavaMailSender mailSender;

    private final java.util.Map<String, LocalDateTime> lastSent = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int DEDUP_HOURS = 6;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm");

    public DeadlineEmailScheduler(TaskService taskService,
                                  UserRepo userRepository,
                                  JavaMailSender mailSender) {
        this.taskService = taskService;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    @Scheduled(fixedRate = 60000)
    public void sendDeadlineEmails() {
        LocalDateTime now = LocalDateTime.now();

        // Only send if due within 6 hours
        List<Task> urgentTasks = taskService.findByDeadlineBetween(now, now.plusHours(6));
        for (Task task : urgentTasks) {
            if (task.isCompleted()) continue;
            Optional<User> userOpt = userRepository.findById(task.getUserId());
            if (userOpt.isEmpty() || !userOpt.get().isEmailRemindersEnabled()) continue;
            if (!recentlySent(task.getId(), "today", now)) {
                sendEmail(userOpt.get(), task);
                markSent(task.getId(), "today", now);
            }
        }
    }

    private void sendEmail(User user, Task task) {
        String toEmail = user.getEmail();
        String firstName = user.getFirstName();
        String name = (firstName != null && !firstName.isBlank()) ? firstName : "Student";

        String subject = "Reminder: " + task.getCourse() + " — " + task.getTitle() + " is due soon";

        String deadlineStr = task.getDeadline().format(FMT);
        String timeLabel = "very soon";

        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Deadline Reminder</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi <strong>%s</strong>,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  This is a reminder that your task is due <strong>%s</strong>:
                </p>
                <div style="background: #f0f0f8; border-left: 4px solid #5a3e8a; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
                  <div style="font-size: 12px; color: #7a6aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">%s</div>
                  <div style="font-size: 16px; font-weight: 700; color: #1f3060;">%s</div>
                  <div style="font-size: 13px; color: #666; margin-top: 6px;">Due: %s</div>
                </div>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">Good luck! — The KourseKit Team</p>
              </div>
            </div>
            """.formatted(name, timeLabel, task.getCourse(), task.getTitle(), deadlineStr);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send deadline email to " + toEmail + ": " + e.getMessage());
        }
    }

    private String dedupKey(Long taskId, String window) {
        return taskId + "_" + window;
    }

    private boolean recentlySent(Long taskId, String window, LocalDateTime now) {
        LocalDateTime last = lastSent.get(dedupKey(taskId, window));
        return last != null && last.isAfter(now.minusHours(DEDUP_HOURS));
    }

    private void markSent(Long taskId, String window, LocalDateTime now) {
        lastSent.put(dedupKey(taskId, window), now);
    }
}