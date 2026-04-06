package com.koursekit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
public class UserSession {
    @Id
    private String jti;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public UserSession() {}
    public UserSession(String jti, Long userId, String deviceName) {
        this.jti = jti;
        this.userId = userId;
        this.deviceName = deviceName;
        this.lastLogin = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public String getJti() { return jti; }
    public Long getUserId() { return userId; }
    public String getDeviceName() { return deviceName; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
