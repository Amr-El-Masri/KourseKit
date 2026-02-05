package com.koursekalculator.dto;

public class RequiredFinalGradeResponse {
    private double requiredFinalGrade;
    private boolean isAchievable;
    private String message;
    private String targetLetterGrade;

    public RequiredFinalGradeResponse() {}

    public RequiredFinalGradeResponse(double requiredFinalGrade, boolean isAchievable,
                                     String message, String targetLetterGrade) {
        this.requiredFinalGrade = requiredFinalGrade;
        this.isAchievable = isAchievable;
        this.message = message;
        this.targetLetterGrade = targetLetterGrade;
    }

    public double getRequiredFinalGrade() { return requiredFinalGrade; }
    public void setRequiredFinalGrade(double requiredFinalGrade) {
        this.requiredFinalGrade = requiredFinalGrade;
    }

    public boolean isAchievable() { return isAchievable; }
    public void setAchievable(boolean achievable) { isAchievable = achievable; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetLetterGrade() { return targetLetterGrade; }
    public void setTargetLetterGrade(String targetLetterGrade) {
        this.targetLetterGrade = targetLetterGrade;
    }
}
