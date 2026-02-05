package com.koursekalculator.dto;

public class CumulativeGPAResponse {
    private double cgpa;
    private int totalCredits;
    private String message;

    public CumulativeGPAResponse() {}

    public CumulativeGPAResponse(double cgpa, int totalCredits, String message) {
        this.cgpa = cgpa;
        this.totalCredits = totalCredits;
        this.message = message;
    }

    public double getCgpa() { return cgpa; }
    public void setCgpa(double cgpa) { this.cgpa = cgpa; }

    public int getTotalCredits() { return totalCredits; }
    public void setTotalCredits(int totalCredits) { this.totalCredits = totalCredits; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
