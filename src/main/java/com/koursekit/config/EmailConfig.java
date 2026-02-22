package com.koursekit.config;

import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Configuration
@Component
public class EmailConfig {
    @Value("${email.username}")
    private String user;
    @Value("${email.password}")
    private String pass;

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
    
    public void verificationmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("KourseKit - Verify Your Email");  
        String verificationLink = "http://localhost:3000?verify_token=" + token;
        message.setText("Click here to verify your account:\n\n" + verificationLink);
        javaMailSender().send(message);
    }

    public void resetpasswordmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("KourseKit - Reset Your Password");
        String resetLink = "http://localhost:3000?reset_token=" + token;
        message.setText("Please click the link below to reset your password. \n\n"
            + resetLink + "\nThe link will expire in 30 minutes. \nIf you didn't request this, you can ignore this email.");
        javaMailSender().send(message);
    }
}