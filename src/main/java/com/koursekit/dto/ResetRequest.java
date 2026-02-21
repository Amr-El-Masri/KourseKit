package com.koursekit.dto;

public class ResetRequest {
    private String token, newpass;

    public String gettoken() { return token; }
    public void settoken(String token) { this.token = token; }
    public String getnewpass() { return newpass; }
    public void setnewpass(String newpass) { this.newpass = newpass; }
}
