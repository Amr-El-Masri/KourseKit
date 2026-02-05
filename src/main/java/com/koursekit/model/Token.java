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

    public Long getid() { return id; }
    public void setid(Long id) { this.id = id; }
    
    public User getuser() { return user; }
    public void setuser(User user) { this.user = user; }
    
    public String getvalue() { return value; }
    public void setvalue(String value) { this.value = value; }
    
    public String gettype() { return type; }
    public void settype(String type) { this.type = type; }
    
    public LocalDateTime getexpires() { return expires; }
    public void setexpires(LocalDateTime expires) { this.expires = expires; }
    
    public LocalDateTime getcreated() { return created; }
    public void setcreated(LocalDateTime created) { this.created = created; }
    
    public LocalDateTime getused() { return used; }
    public void setused(LocalDateTime used) { this.used = used; }
    
    public Boolean getexpired() { return expired; }
    public void setexpired(Boolean expired) { this.expired = expired; }
}