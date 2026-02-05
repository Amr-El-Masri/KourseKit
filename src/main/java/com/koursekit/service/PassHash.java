package com.koursekit.service;

import org.springframework.stereotype.Component;

import at.favre.lib.crypto.bcrypt.BCrypt;

@Component
public class PassHash {
    public String hash(String password) { return BCrypt.withDefaults().hashToString(10, password.toCharArray()); }
    public boolean check(String password, String hash) { return BCrypt.verifyer().verify(password.toCharArray(), hash).verified; }
    public boolean checkvalidity(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }
}
