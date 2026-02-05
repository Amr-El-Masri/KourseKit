package com.koursekit.dto;

public class RequiredFutureGPAResponse {
    private double requiredGPA;
    private boolean isAchievable;
    private String message;

    public RequiredFutureGPAResponse() {}

    public RequiredFutureGPAResponse(double requiredGPA, boolean isAchievable, String message) {
        this.requiredGPA = requiredGPA;
        this.isAchievable = isAchievable;
        this.message = message;
    }

    public double getRequiredGPA() { return requiredGPA; }
    public void setRequiredGPA(double requiredGPA) { this.requiredGPA = requiredGPA; }

    public boolean isAchievable() { return isAchievable; }
    public void setAchievable(boolean achievable) { isAchievable = achievable; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
