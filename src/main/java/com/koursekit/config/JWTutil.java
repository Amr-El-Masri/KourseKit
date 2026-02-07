package com.koursekit.config;

import java.util.Date;

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
    
    @Value("${jwt.expiration}") // in app properties
    private Long expiration;
    
    private Algorithm getalg() { return Algorithm.HMAC256(secret); }
    public String generate(Long userid, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);
        return JWT.create()
                .withSubject(userid.toString())
                .withClaim("email", email)
                .withIssuedAt(now)
                .withExpiresAt(expiry)
                .sign(getalg());
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
}
