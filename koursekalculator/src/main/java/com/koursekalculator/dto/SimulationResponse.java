package com.koursekalculator.dto;

public class SimulationResponse {
    private double simulatedCourseGrade;
    private String simulatedLetterGrade;
    private double simulatedSemesterGPA;
    private double gpaChange;
    private String message;

    public SimulationResponse() {}

    public SimulationResponse(double simulatedCourseGrade, String simulatedLetterGrade,
                             double simulatedSemesterGPA, double gpaChange, String message) {
        this.simulatedCourseGrade = simulatedCourseGrade;
        this.simulatedLetterGrade = simulatedLetterGrade;
        this.simulatedSemesterGPA = simulatedSemesterGPA;
        this.gpaChange = gpaChange;
        this.message = message;
    }

    public double getSimulatedCourseGrade() { return simulatedCourseGrade; }
    public void setSimulatedCourseGrade(double simulatedCourseGrade) {
        this.simulatedCourseGrade = simulatedCourseGrade;
    }

    public String getSimulatedLetterGrade() { return simulatedLetterGrade; }
    public void setSimulatedLetterGrade(String simulatedLetterGrade) {
        this.simulatedLetterGrade = simulatedLetterGrade;
    }

    public double getSimulatedSemesterGPA() { return simulatedSemesterGPA; }
    public void setSimulatedSemesterGPA(double simulatedSemesterGPA) {
        this.simulatedSemesterGPA = simulatedSemesterGPA;
    }

    public double getGpaChange() { return gpaChange; }
    public void setGpaChange(double gpaChange) { this.gpaChange = gpaChange; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
