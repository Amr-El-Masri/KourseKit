package com.koursekit.model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name="users")
public class User {
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String pass;

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(name = "verification_token")
    private String token;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    @Column(name = "token_expiry")
    private LocalDateTime tokenexpiration;

    @Column(name = "created_at")
    private LocalDateTime createdat=LocalDateTime.now();

    @Column(name = "role", nullable = false)
    private String role = "STUDENT";

    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean active = true;

    public User() {}
    public User(String email, String pass) {
        this.email = email;
        this.pass = pass;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPass() { return pass; }
    public void setPass(String pass) { this.pass = pass; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean ver) { verified = ver; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getTokenExpiration() { return tokenexpiration; }
    public void setTokenExpiration(LocalDateTime tokenexpiration) { this.tokenexpiration = tokenexpiration; }

    public LocalDateTime getCreatedAt() { return createdat; }
    public void setCreatedAt(LocalDateTime createdat) { this.createdat = createdat; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    // integrate microsoft login?
}
