package com.koursekit.dto;

public class AuthResponse {
    private String message, token, email;
    private boolean success;

    public String getmessage() { return message; }
    public void setmessage(String message) { this.message = message; }
    public String gettoken() { return token; }
    public void settoken(String token) { this.token = token; }
    public boolean getsuccess() { return success; }
    public void setsuccess(boolean success) { this.success = success; }
    public String getemail() { return email; }
    public void setemail(String email) { this.email = email; }
}
