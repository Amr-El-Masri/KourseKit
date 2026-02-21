package com.koursekit.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.dto.AuthResponse;
import com.koursekit.dto.ChangeRequest;
import com.koursekit.dto.ForgotRequest;
import com.koursekit.dto.Login;
import com.koursekit.dto.ResetRequest;
import com.koursekit.dto.Signup;
import com.koursekit.service.AuthService;
import com.koursekit.service.RateLimiter;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // allow all origins for development
public class AuthController {
    @Autowired
    private AuthService service;
    @Autowired
    private RateLimiter rateLimiter;

    @Value("${ratelimit.login.max}")
    private int loginMax;
    @Value("${ratelimit.login.window}")
    private long loginWindow;
    @Value("${ratelimit.signup.max}")
    private int signupMax;
    @Value("${ratelimit.signup.window}")
    private long signupWindow;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody Signup request, HttpServletRequest http) {
        String ip = getClientIP(http);
        if (!rateLimiter.isallowed("Signup:" + ip, signupMax, signupWindow)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errormessage("Too many signup attempts. Please try again later."));
        }
        try {
            AuthResponse response = service.signup(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("Server Error"));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyemail(@RequestParam String token) {
        try {
            AuthResponse response = service.verifyemail(token);
                return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("Server Error"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Login request, HttpServletRequest http) {
        String ip = getClientIP(http);
        if (!rateLimiter.isallowed("Login:" + ip, loginMax, loginWindow)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errormessage("Too many login attempts. Please try again in 15 minutes."));
        }
        try {
            AuthResponse response = service.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage("Error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("Server Error"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotpassword(@RequestBody ForgotRequest request, HttpServletRequest http) {
        String ip = getClientIP(http);
        if (!rateLimiter.isallowed("Forgot:" + ip, signupMax, signupWindow)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errormessage("Too many requests. Please try again later."));
        }
        try {
            AuthResponse response = service.forgotpassword(request.getemail());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("Server Error"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changepassword(@RequestBody ChangeRequest request, HttpServletRequest http) {
        String ip = getClientIP(http);
        if (!rateLimiter.isallowed("ChangePass:" + ip, loginMax, loginWindow)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errormessage("Too many attempts. Please try again later."));
        }
        try {
            AuthResponse response = service.changepassword(request.getemail(), request.getcurrentpass(), request.getnewpass());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errormessage(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(errormessage("Server Error"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetpassword(@RequestBody ResetRequest request) {
        try {
            AuthResponse response = service.resetpassword(request.gettoken(), request.getnewpass());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errormessage(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(errormessage("Server Error"));
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private AuthResponse errormessage(String message) {
        AuthResponse response = new AuthResponse();
        response.setsuccess(false);
        response.setmessage(message);
        return response;
    }
}
