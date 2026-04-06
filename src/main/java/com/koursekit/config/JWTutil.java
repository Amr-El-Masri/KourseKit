package com.koursekit.config;

import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class JWTutil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.expiration.remember}")
    private Long expirationRemember;

    private Algorithm getalg() { return Algorithm.HMAC256(secret); }
    public String generate(Long userid, String email, String role) {
        return generate(userid, email, role, false);
    }
    public String generate(Long userid, String email, String role, boolean rememberMe) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (rememberMe ? expirationRemember : expiration));
        return JWT.create()
                .withJWTId(UUID.randomUUID().toString())
                .withSubject(userid.toString())
                .withClaim("email", email)
                .withClaim("role", role)
                .withClaim("rem", rememberMe)
                .withIssuedAt(now)
                .withExpiresAt(expiry)
                .sign(getalg());
    }

    public String getJti(String token) {
        return JWT.decode(token).getId();
    }
    
    public boolean validatetoken(String token) {
        try {
            JWT.require(getalg()).build();
            JWT.require(getalg()).build().verify(token);
            return true;
        } catch (JWTVerificationException e) { return false; }
    }
    
    public String gettokenuserid(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getSubject();
    }
    
    public String gettokenemail(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("email").asString();
    }

    public String gettokenrole(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("role").asString();
    }

    public boolean getTokenRememberMe(String token) {
        DecodedJWT jwt = JWT.decode(token);
        Boolean rem = jwt.getClaim("rem").asBoolean();
        return rem != null && rem;
    }

    public Date getTokenIssuedAt(String token) {
        return JWT.decode(token).getIssuedAt();
    }
}
