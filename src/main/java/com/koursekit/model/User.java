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

    public User() {}
    public User(String email, String pass) {
        this.email = email;
        this.pass = pass;
    }

    public String getemail() { return email; }
    public void setemail(String email) { this.email = email; }

    public String getpass() { return pass; }
    public void setpass(String pass) { this.pass = pass; }

    public Long getid() { return id; }
    public void setid(Long id) { this.id=id; }

    public boolean isver() { return verified; }
    public void setver(boolean ver) { verified = ver; }

    public String gettoken() { return token; }
    public void settoken(String token) { this.token = token; }

    public LocalDateTime gettokenexpiration() { return tokenexpiration; }
    public void settokenexpiration(LocalDateTime tokenexpiration) { this.tokenexpiration = tokenexpiration; }

    public LocalDateTime getcreated() { return createdat; }
    public void setcreated(LocalDateTime createdat) { this.createdat = createdat; }

    // integrate microsoft login?
}
