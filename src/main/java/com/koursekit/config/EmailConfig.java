package com.koursekit.config;

import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;


@Configuration
@Component
public class EmailConfig {
    @Value("${email.username}")
    private String user;
    @Value("${email.password}")
    private String pass;
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    @Autowired
    @Lazy
    private JavaMailSender mailSender;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sentby = new JavaMailSenderImpl();
        
        sentby.setHost("smtp.gmail.com");
        sentby.setPort(587);
        sentby.setUsername(user); 
        sentby.setPassword(pass); 
        
        Properties props = sentby.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true"); 
        return sentby;
    }
    
    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(user, "KourseKit");
            helper.setTo(toEmail);
            helper.setReplyTo(user);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }
    
    public void verificationmail(String email, String token) {
        String verificationLink = frontendUrl + "?verify_token=" + token;
        
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Email Verification</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  Thanks for signing up! Please verify your email address to get started.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="%s" style="background: #1f3060; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 24px; margin-bottom: 0;">Or copy this link: %s</p>
                <p style="font-size: 13px; color: #888; margin-top: 8px; margin-bottom: 0;">The link will expire in 15 minutes.</p>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">Welcome aboard! — The KourseKit Team</p>
              </div>
            </div>
            """.formatted(verificationLink, verificationLink);
        
        sendHtmlEmail(email, "KourseKit - Verify Your Email", html);
    }

    public void accountdeletionmail(String email) {
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Account Deleted</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi there,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  Your KourseKit account has been permanently deleted. We're sorry to see you go and hope to welcome you back soon.
                </p>
                <div style="background: #f0f0f8; border-left: 4px solid #888; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
                  <p style="font-size: 13px; color: #666; margin: 0;">This action is irreversible. If you didn't request this, please contact our support team immediately.</p>
                </div>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">We're sorry to see you go. — The KourseKit Team</p>
              </div>
            </div>
            """;

        sendHtmlEmail(email, "KourseKit - Your Account Has Been Deleted", html);
    }

    public void deactivationmail(String email) {
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Account Update</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi there,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  Your KourseKit account has been deactivated by an administrator for going against our policy.
                </p>
                <div style="background: #f0f0f8; border-left: 4px solid #d32f2f; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
                  <p style="font-size: 13px; color: #666; margin: 0;">If you believe this was a mistake, please contact our support team.</p>
                </div>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">— The KourseKit Team</p>
              </div>
            </div>
            """;
        
        sendHtmlEmail(email, "KourseKit - Your Account Has Been Deactivated", html);
    }

    public void activationmail(String email) {
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Account Update</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi there,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  Your KourseKit account has been reactivated by an administrator.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="http://localhost:3000" style="background: #1f3060; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Log in now!</a>
                </div>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">Welcome back! — The KourseKit Team</p>
              </div>
            </div>
            """;
        
        sendHtmlEmail(email, "KourseKit - Your Account Has Been Reactivated", html);
    }

    public void resetpasswordmail(String email, String token) {
        String resetLink = "http://localhost:3000?reset_token=" + token;
        
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #e8e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #c8c8d8;">
              <div style="background: #1f3060; padding: 24px 28px;">
                <h1 style="color: white; font-size: 20px; margin: 0;">KourseKit</h1>
                <p style="color: #90a8d0; font-size: 13px; margin: 4px 0 0;">Password Reset</p>
              </div>
              <div style="padding: 28px;">
                <p style="font-size: 15px; color: #1a1040; margin: 0 0 12px;">Hi there,</p>
                <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
                  We received a request to reset your password. Click the button below to create a new one.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="%s" style="background: #1f3060; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 24px; margin-bottom: 0;">Or copy this link: %s</p>
                <p style="font-size: 13px; color: #888; margin-top: 8px; margin-bottom: 0;">The link will expire in 30 minutes.</p>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">If you didn't request this, you can ignore this email.</p>
                <p style="font-size: 13px; color: #888; margin-top: 24px; margin-bottom: 0;">— The KourseKit Team</p>
              </div>
            </div>
            """.formatted(resetLink, resetLink);
        
        sendHtmlEmail(email, "KourseKit - Reset Your Password", html);
    }
}