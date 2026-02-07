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
@Table(name = "tokens")
public class Token {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, unique = true)
    private String value;
    
    private String type;
    private LocalDateTime expires, used, created=LocalDateTime.now();
    private boolean expired = false;

    
    public Token() {}

    public Token(User user, String value, String type, LocalDateTime expires) {
        this.user = user;
        this.value = value;
        this.type = type;
        this.expires = expires;
    }
    
    public boolean valid() { return !expired && expires.isAfter(LocalDateTime.now()) && used == null; }
    public void used() { this.used = LocalDateTime.now(); }
    public void revoke() { this.expired = true; }
    public boolean expired() { return expires.isBefore(LocalDateTime.now()); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getExpires() { return expires; }
    public void setExpires(LocalDateTime expires) { this.expires = expires; }

    public LocalDateTime getCreated() { return created; }
    public void setCreated(LocalDateTime created) { this.created = created; }

    public LocalDateTime getUsed() { return used; }
    public void setUsed(LocalDateTime used) { this.used = used; }

    public Boolean getExpired() { return expired; }
    public void setExpired(Boolean expired) { this.expired = expired; }
}