package com.koursekalculator.dto;

public class SemesterGPAResponse {
    private double gpa;
    private String message;

    public SemesterGPAResponse() {}

    public SemesterGPAResponse(double gpa, String message) {
        this.gpa = gpa;
        this.message = message;
    }

    public double getGpa() { return gpa; }
    public void setGpa(double gpa) { this.gpa = gpa; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
