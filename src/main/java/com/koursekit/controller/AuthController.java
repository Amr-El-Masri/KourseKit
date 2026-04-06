package com.koursekit.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.koursekit.config.JWTutil;
import com.koursekit.dto.AuthResponse;
import com.koursekit.dto.ChangeRequest;
import com.koursekit.dto.ForgotRequest;
import com.koursekit.dto.Login;
import com.koursekit.dto.ResetRequest;
import com.koursekit.dto.Signup;
import com.koursekit.model.User;
import com.koursekit.model.UserSession;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.UserSessionRepo;
import com.koursekit.service.AuthService;
import com.koursekit.service.RateLimiter;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // allow all origins for development
public class AuthController {
    @Autowired private AuthService service;
    @Autowired private RateLimiter rateLimiter;
    @Autowired private JWTutil jwtutil;
    @Autowired private UserRepo userRepo;
    @Autowired private UserSessionRepo sessionRepo;

    @Value("${ratelimit.login.max}")
    private int loginMax;
    @Value("${ratelimit.login.window}")
    private long loginWindow;
    @Value("${ratelimit.signup.max}")
    private int signupMax;
    @Value("${ratelimit.signup.window}")
    private long signupWindow;

    @jakarta.transaction.Transactional
    private void recordSession(String token, String userAgentHeader) {
        String jti = jwtutil.getJti(token);
        if (jti == null) return;
        Long userId = Long.parseLong(jwtutil.gettokenuserid(token));
        String device = parseDevice(userAgentHeader);
        sessionRepo.deleteByUserIdAndDeviceName(userId, device);
        sessionRepo.save(new UserSession(jti, userId, device));
    }

    private String parseDevice(String ua) {
        if (ua == null) return "Unknown device";
        if (ua.contains("iPhone")) return "iPhone";
        if (ua.contains("iPad")) return "iPad";
        if (ua.contains("Android") && ua.contains("Mobile")) return "Android Phone";
        if (ua.contains("Android")) return "Android Tablet";
        if (ua.contains("Macintosh")) return "Mac";
        if (ua.contains("Windows")) return "Windows PC";
        if (ua.contains("Linux")) return "Linux";
        return "Unknown device";
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody Signup request, HttpServletRequest http) {
        String ip = getClientIP(http);
        if (!rateLimiter.isallowed("Signup:" + ip, signupMax, signupWindow)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errormessage("Too many signup attempts. Please try again later."));
        }
        try {
            AuthResponse response = service.signup(request.getEmail(), request.getPassword(), request.isRememberMe());
            if (response.getsuccess() && response.gettoken() != null)
                recordSession(response.gettoken(), http.getHeader("User-Agent"));
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
            AuthResponse response = service.login(request.getEmail(), request.getPassword(), request.isRememberMe());
            if (response.getsuccess() && response.gettoken() != null)
                recordSession(response.gettoken(), http.getHeader("User-Agent"));
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

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest http) {
        String authHeader = http.getHeader("authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(errormessage("No token provided."));
        }
        String oldToken = authHeader.substring(7);
        try {
            if (!jwtutil.validatetoken(oldToken)) return ResponseEntity.status(401).body(errormessage("Invalid token."));
            String userId = jwtutil.gettokenuserid(oldToken);
            User user = userRepo.findById(Long.parseLong(userId)).orElseThrow();
            boolean rememberMe = jwtutil.getTokenRememberMe(oldToken);
            // reject if user has invalidated all tokens
            if (user.getTokenIssuedAfter() != null) {
                java.util.Date issuedAt = jwtutil.getTokenIssuedAt(oldToken);
                if (issuedAt != null && issuedAt.toInstant().isBefore(user.getTokenIssuedAfter().atZone(java.time.ZoneId.systemDefault()).toInstant())) {
                    return ResponseEntity.status(401).body(errormessage("Session invalidated."));
                }
            }
            String newToken = jwtutil.generate(user.getId(), user.getEmail(), user.getRole(), rememberMe);
            // update session record
            String oldJti = jwtutil.getJti(oldToken);
            if (oldJti != null) sessionRepo.deleteById(oldJti);
            recordSession(newToken, http.getHeader("User-Agent"));
            AuthResponse response = new AuthResponse();
            response.setsuccess(true);
            response.settoken(newToken);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(errormessage("Could not refresh token."));
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(HttpServletRequest http) {
        String authHeader = http.getHeader("authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ResponseEntity.status(401).build();
        String token = authHeader.substring(7);
        try {
            String userId = jwtutil.gettokenuserid(token);
            String currentJti = jwtutil.getJti(token);
            List<UserSession> sessions = sessionRepo.findByUserId(Long.parseLong(userId));
            List<Map<String, Object>> result = sessions.stream().map(s -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("jti", s.getJti());
                m.put("deviceName", s.getDeviceName());
                m.put("lastLogin", s.getLastLogin().toString());
                m.put("current", s.getJti().equals(currentJti));
                return m;
            }).toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/sessions/{jti}")
    public ResponseEntity<?> deleteSession(@PathVariable String jti, HttpServletRequest http) {
        String authHeader = http.getHeader("authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return ResponseEntity.status(401).build();
        String token = authHeader.substring(7);
        try {
            String userId = jwtutil.gettokenuserid(token);
            UserSession session = sessionRepo.findById(jti).orElse(null);
            if (session == null || !session.getUserId().equals(Long.parseLong(userId)))
                return ResponseEntity.status(403).build();
            sessionRepo.deleteById(jti);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/logout-all")
    public ResponseEntity<AuthResponse> logoutAll(HttpServletRequest http) {
        String authHeader = http.getHeader("authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(errormessage("No token provided."));
        }
        String token = authHeader.substring(7);
        try {
            String userId = jwtutil.gettokenuserid(token);
            User user = userRepo.findById(Long.parseLong(userId)).orElseThrow();
            user.setTokenIssuedAfter(java.time.LocalDateTime.now());
            userRepo.save(user);
            sessionRepo.deleteByUserId(Long.parseLong(userId));
            AuthResponse response = new AuthResponse();
            response.setsuccess(true);
            response.setmessage("Logged out of all sessions.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(errormessage("Server Error"));
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
