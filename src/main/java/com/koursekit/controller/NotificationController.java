package com.koursekit.controller;

import com.koursekit.dto.NotificationDTO;
import com.koursekit.model.Notification;
import com.koursekit.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/*
 * REST controller for notification-related endpoints.
 * Returns only NotificationDTOs to the frontend.
 * All notifications are in-app and cannot be modified by the user.
 */

@RestController
@RequestMapping
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService){
        this.notificationService=notificationService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO> > getNotifications(){
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }
}
