package com.koursekit.dto;

public class CumulativeGradeResponse {
    private double gpa;
    private int totalCredits;
    private String message;

    public CumulativeGradeResponse() {}

    public CumulativeGradeResponse(double gpa, int totalCredits, String message) {
        this.gpa = gpa;
        this.totalCredits = totalCredits;
        this.message = message;
    }

    public double getGpa() {
        return gpa;
    }
    public void setGpa(double gpa) {
        this.gpa = gpa;
    }

    public int getTotalCredits() { 
        return totalCredits; 
    }
    public void setTotalCredits(int totalCredits) { 
        this.totalCredits = totalCredits; 
    }

    public String getMessage() { 
        return message;
     }
    public void setMessage(String message) { 
        this.message = message; 
    }
}
