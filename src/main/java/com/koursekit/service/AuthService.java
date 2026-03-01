package com.koursekit.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koursekit.config.EmailConfig;
import com.koursekit.config.JWTutil;
import com.koursekit.dto.AuthResponse;
import com.koursekit.model.PassHistory;
import com.koursekit.model.Token;
import com.koursekit.model.User;
import com.koursekit.repository.PassRepo;
import com.koursekit.repository.TokenRepo;
import com.koursekit.repository.UserRepo;

@Service
@Transactional
public class AuthService {
    @Autowired
    private PassHash passhasher;
    @Autowired
    private JWTutil jwtutil;
    @Autowired
    private UserRepo userrepo;
    @Autowired
    private TokenRepo tokenrepo;
    @Autowired
    private EmailConfig emailconfig;
    @Autowired
    private PassRepo passhistoryrepo;

    public AuthResponse signup(String email, String password) {
        if (!isvalidaubmail(email)) { throw new IllegalArgumentException("Invalid email."); }
        if (userrepo.existsByEmail(email)) { throw new IllegalArgumentException("Email is already in use."); }
        validatepassword(password);
        String passhash = passhasher.hash(password);

        User user = new User(email, passhash);
        user.setVerified(false);
        user.setRole("STUDENT");
        user.setActive(true);
        userrepo.save(user);
        passhistoryrepo.save(new PassHistory(user, passhash));

        String veriftoken = UUID.randomUUID().toString();
        Token token = new Token(user, veriftoken, "EMAIL_VERIFICATION", LocalDateTime.now().plusMinutes(10));
        tokenrepo.save(token);

        System.out.println("Verification link: http://localhost:3000?verify_token=" + token.getValue());
        try {
            emailconfig.verificationmail(email, token.getValue());
            System.out.println("Verification email sent to " + email);
        } catch (Exception emailEx) {
            System.err.println("[WARN] Email send failed — use link above to verify: " + emailEx.getMessage());
        }

        String jwttoken = jwtutil.generate(user.getId(), user.getEmail(), user.getRole());

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Signup successful.\nYou can login now.");
        response.settoken(jwttoken);
        return response;
    }

    public AuthResponse verifyemail(String value) {
        Token veriftoken = tokenrepo
        .findByValueAndType(value, "EMAIL_VERIFICATION")
        .orElseThrow(() -> new IllegalArgumentException("Invalid Token."));

        if (veriftoken.getExpires().isBefore(LocalDateTime.now())) { throw new IllegalArgumentException("Expired Token."); }
        if (veriftoken.getUsed() != null) { throw new IllegalArgumentException("Token has already been used."); }

        User user = veriftoken.getUser();
        user.setVerified(true);
        user.setTokenExpiration(null);

        userrepo.save(user);
        veriftoken.used();
        tokenrepo.save(veriftoken);

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Email Verified!");
        response.setemail(user.getEmail());
        return response;
    }

    public AuthResponse login(String email, String password) {
        User user = userrepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!user.isVerified()) { throw new IllegalArgumentException("Email has not been verified."); }
        if (!user.isActive()) { throw new IllegalArgumentException("Account is deactivated."); }
        if (!passhasher.check(password, user.getPass())) { throw new IllegalArgumentException("Invalid email or password."); }

        String jwttoken = jwtutil.generate(user.getId(), email, user.getRole());

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Login successful.");
        response.settoken(jwttoken);

        System.out.println("JWT token: " + jwttoken);
        System.out.println("Response token: " + response.gettoken());
        return response;
    }

    public AuthResponse forgotpassword(String email) {
        if (!isvalidaubmail(email)) { throw new IllegalArgumentException("Please enter a valid AUB email."); }
        User user = userrepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Please enter a valid AUB email"));

        String resettoken = UUID.randomUUID().toString();
        Token token = new Token(user, resettoken, "PASSWORD_RESET", LocalDateTime.now().plusMinutes(30));
        tokenrepo.save(token);
        emailconfig.resetpasswordmail(email, resettoken);

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Password reset link sent.\nCheck your email.");
        return response;
    }

    public AuthResponse changepassword(String email, String currentpass, String newpass) {
        User user = userrepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (!passhasher.check(currentpass, user.getPass())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        validatepassword(newpass);
        if (waspreviouslyused(user, newpass)) { throw new IllegalArgumentException("You can't use a previously used password."); }
        String newhash = passhasher.hash(newpass);
        user.setPass(newhash);
        userrepo.save(user);
        passhistoryrepo.save(new PassHistory(user, newhash));

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Password changed successfully.");
        return response;
    }

    public AuthResponse resetpassword(String tokenValue, String newPassword) {
        Token resettoken = tokenrepo
            .findByValueAndType(tokenValue, "PASSWORD_RESET")
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token."));
        if (!resettoken.valid()) { throw new IllegalArgumentException("Invalid or expired reset token."); }
        validatepassword(newPassword);

        User user = resettoken.getUser();
        if (waspreviouslyused(user, newPassword)) { throw new IllegalArgumentException("You can't use a previously used password."); }
        String newhash = passhasher.hash(newPassword);
        user.setPass(newhash);
        userrepo.save(user);
        passhistoryrepo.save(new PassHistory(user, newhash));
        resettoken.used();
        tokenrepo.save(resettoken);

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("Password reset successfully.\nYou can now log in.");
        response.setemail(user.getEmail());
        return response;
    }

    private void validatepassword(String password) {
        if (password == null || password.length() < 8)
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        if (!password.matches(".*[A-Z].*"))
            throw new IllegalArgumentException("Password must contain at least one uppercase letter.");
        if (!password.matches(".*[a-z].*"))
            throw new IllegalArgumentException("Password must contain at least one lowercase letter.");
        if (!password.matches(".*\\d.*"))
            throw new IllegalArgumentException("Password must contain at least one number.");
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*"))
            throw new IllegalArgumentException("Password must contain at least one special character.");
    }

    private boolean waspreviouslyused(User user, String plainpassword) {
        return passhistoryrepo.findByUser(user).stream()
            .anyMatch(h -> passhasher.check(plainpassword, h.getPassHash()));
    }

    private boolean isvalidaubmail(String email) { return email.endsWith("@mail.aub.edu"); }
    public void printusers() { for (User user : userrepo.findAll()) { System.out.println(user.getEmail() + " verified " + user.isVerified()); } }
}
