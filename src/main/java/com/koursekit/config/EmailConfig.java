package com.koursekit.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Configuration
@Component
public class EmailConfig {
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sentby = new JavaMailSenderImpl();
        
        sentby.setHost("smtp.gmail.com");
        sentby.setPort(587);
        sentby.setUsername("koursekit@gmail.com"); 
        sentby.setPassword("meow237"); 
        
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
        message.setSubject("verify ur acc");  //change it later brah to smth metel l khale2
        String verificationLink = "http://localhost:8080/verify-email.html?token=" + token;
        message.setText("Click here to verify your account:\n\n" + verificationLink);
        javaMailSender().send(message);
    }
}