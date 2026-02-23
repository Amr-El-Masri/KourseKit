package com.koursekit.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_history")
public class PassHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "pass_hash", nullable = false)
    private String passHash;
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public PassHistory() {}

    public PassHistory(User user, String passHash) {
        this.user = user;
        this.passHash = passHash;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getPassHash() { return passHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
