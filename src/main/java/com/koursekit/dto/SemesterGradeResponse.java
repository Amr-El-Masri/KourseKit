package com.koursekit.dto;

public class SemesterGradeResponse {
    private double gpa;
    private String message;

    public SemesterGradeResponse() {}

    public SemesterGradeResponse(double gpa, String message) {
        this.gpa = gpa;
        this.message = message;
    }

    public double getGpa() { return gpa; }
    public void setGpa(double gpa) { this.gpa = gpa; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
