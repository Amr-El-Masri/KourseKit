package com.koursekit.dto;

public class RequiredFutureGradeRequest {
    private double currentCGPA;
    private int completedCredits;
    private double targetCGPA;
    private int remainingCredits;

    public RequiredFutureGradeRequest() {}

    public double getCurrentCGPA() { 
        return currentCGPA; 
    }
    public void setCurrentCGPA(double currentCGPA) { 
        this.currentCGPA = currentCGPA; 
    }

    public int getCompletedCredits() { return completedCredits; }
    public void setCompletedCredits(int completedCredits) { this.completedCredits = completedCredits; }

    public double getTargetCGPA() { 
        return targetCGPA; 
    }
    public void setTargetCGPA(double targetCGPA) { 
        this.targetCGPA = targetCGPA; 
    }

    public int getRemainingCredits() { 
        return remainingCredits; 
    }
    public void setRemainingCredits(int remainingCredits) { 
        this.remainingCredits = remainingCredits; 
    }
}
