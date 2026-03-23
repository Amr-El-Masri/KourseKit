package com.koursekit.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Admins {
    private Long id;
    private String email;
    private String role;
    private boolean active;
    private LocalDateTime createdat;
    private int reportCount;
    private boolean flagged;
    private String flagReason;
    private int strikeCount;

    public Admins(Long id, String email, String role, boolean active, LocalDateTime createdat,
                  int reportCount, boolean flagged, String flagReason, int strikeCount) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.active = active;
        this.createdat = createdat;
        this.reportCount = reportCount;
        this.flagged = flagged;
        this.flagReason = flagReason;
        this.strikeCount = strikeCount;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedat() { return createdat; }
    @JsonProperty("reportcount")
    public int getReportCount() { return reportCount; }
    @JsonProperty("flagged")
    public boolean isFlagged() { return flagged; }
    @JsonProperty("flagreason")
    public String getFlagReason() { return flagReason; }
    @JsonProperty("strikecount")
    public int getStrikeCount() { return strikeCount; }
}
