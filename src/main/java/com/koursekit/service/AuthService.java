package com.koursekit.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koursekit.config.EmailConfig;
import com.koursekit.config.JWTutil;
import com.koursekit.dto.AuthResponse;
import com.koursekit.model.Token;
import com.koursekit.model.User;
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
    
    public AuthResponse signup(String email, String password) {
        if (!isvalidaubmail(email)) { throw new IllegalArgumentException("invalid email"); }
        if (userrepo.existsByEmail(email)) { throw new IllegalArgumentException("email already in use"); }
        String passhash = passhasher.hash(password);
        String veriftoken = UUID.randomUUID().toString();
        LocalDateTime tokenexpiry = LocalDateTime.now().plusMinutes(10);
        
        User user = new User(email, passhash);
        user.setToken(veriftoken);
        user.setTokenExpiration(tokenexpiry);
        user.setVerified(true); // AUTO-VERIFY FOR DEV - change to false for production
        userrepo.save(user);

        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("signup successful - you can now login");
        return response;
    } 
    
    // automsticlly logs in after verification
    public AuthResponse verifyemail(String value) {
        Token veriftoken = tokenrepo
        .findByValueAndType(value, "EMAIL_VERIFICATION")
        .orElseThrow(() -> new IllegalArgumentException("invalid token"));

        if (veriftoken.getExpires().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("token expired"); }

        if (veriftoken.getUsed() != null) {
            throw new IllegalArgumentException("token in use"); }

        User user = veriftoken.getUser();
        user.setVerified(true);
        user.setTokenExpiration(null);

        userrepo.save(user);
        veriftoken.used();
        tokenrepo.save(veriftoken);

        String jwttoken = jwtutil.generate(user.getId(), user.getEmail());
        
        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("logged in successfully");
        response.settoken(jwttoken); 
        return response;
    }

    public AuthResponse login(String email, String password) {
        User user = userrepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("invalid email or password"));
        if (!user.isVerified()) { throw new IllegalArgumentException("email not verified"); }
        if (!passhasher.check(password, user.getPass())) { throw new IllegalArgumentException("invalid email or password."); }

        String jwttoken = jwtutil.generate(user.getId(), email);
        
        AuthResponse response = new AuthResponse();
        response.setsuccess(true);
        response.setmessage("successful login");
        response.settoken(jwttoken);
        return response;
    }
    
    private boolean isvalidaubmail(String email) { return email.endsWith("@mail.aub.edu"); }
    public void printusers() {
        for (User user : userrepo.findAll()) { System.out.println(user.getEmail() + " verified " + user.isVerified()); }
    }
}