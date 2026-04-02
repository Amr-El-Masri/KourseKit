package com.koursekit.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;      
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // allowing access to endpoints
    @Autowired
    private JWTAuthentication jwtauth;
    @Bean
    public SecurityFilterChain security(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/verify", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers("/*.html", "/css/**", "/js/**", "/images/**").permitAll() // static files no token need
                .requestMatchers("/api/courses/search", "/api/courses/*/sections", "/api/courses/professors", "/api/courses/*").permitAll()
                .requestMatchers("/api/reviews/course/**", "/api/reviews/section/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // admin only
                .requestMatchers(HttpMethod.GET, "/api/professor-reviews").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/professor-reviews/submit").authenticated()//only aauthenticated users can post prof reviews
                .requestMatchers(HttpMethod.POST, "/api/reports/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/forum/**").permitAll()       // anyone can read
                .requestMatchers(HttpMethod.POST, "/api/forum/**").authenticated()  // must be logged in to post
                .requestMatchers(HttpMethod.DELETE, "/api/forum/**").authenticated() // must be logged in to delete
                .requestMatchers(HttpMethod.GET, "/api/reviews/recent", "/api/professor-reviews/recent").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/my", "/api/professor-reviews/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/forum/my-posts").authenticated()
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            //
            .addFilterBefore(jwtauth, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:8080",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
