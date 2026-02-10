package com.koursekit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.dto.AuthResponse;
import com.koursekit.dto.Login;
import com.koursekit.dto.Signup;
import com.koursekit.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // allow all origins for development
public class AuthController {

    @Autowired
    private AuthService service;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody Signup request) {
        try {
            AuthResponse response = service.signup(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("server error"));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyemail(@RequestParam String token) {
        try {
            AuthResponse response = service.verifyemail(token);
                return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("server error"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Login request) {
        try {
            AuthResponse response = service.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("server error"));
        }
    }
    
    private AuthResponse errormessage(String message) {
        AuthResponse response = new AuthResponse();
        response.setsuccess(false);
        response.setmessage(message);
        return response;
    }
}