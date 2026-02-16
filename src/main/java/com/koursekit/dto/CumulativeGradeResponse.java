package com.koursekit.dto;

public class CumulativeGradeResponse {
    private double cgpa;
    private int totalCredits;
    private String message;

    public CumulativeGradeResponse() {}

    public CumulativeGradeResponse(double cgpa, int totalCredits, String message) {
        this.cgpa = cgpa;
        this.totalCredits = totalCredits;
        this.message = message;
    }

    public double getCgpa() { 
        return cgpa; 
    }
    public void setCgpa(double cgpa) { 
        this.cgpa = cgpa; 
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
