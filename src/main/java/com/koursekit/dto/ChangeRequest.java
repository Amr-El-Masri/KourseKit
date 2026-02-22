package com.koursekit.dto;

public class ChangeRequest {
    private String email, currentpass, newpass;

    public String getemail() { return email; }
    public void setemail(String email) { this.email = email; }
    public String getcurrentpass() { return currentpass; }
    public void setcurrentpass(String currentpass) { this.currentpass = currentpass; }
    public String getnewpass() { return newpass; }
    public void setnewpass(String newpass) { this.newpass = newpass; }
}
