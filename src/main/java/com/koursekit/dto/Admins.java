package com.koursekit.dto;

import java.time.LocalDateTime;

public class Admins {
    private Long id;
    private String email;
    private String role;
    private boolean active;
    private LocalDateTime createdat;

    public Admins(Long id, String email, String role, boolean active, LocalDateTime createdat) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.active = active;
        this.createdat = createdat;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedat() { return createdat; }
}
