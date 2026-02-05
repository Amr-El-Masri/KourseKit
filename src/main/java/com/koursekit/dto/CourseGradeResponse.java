package com.koursekit.dto;

public class CourseGradeResponse {
    private double numericGrade;
    private String letterGrade;
    private String message;

    public CourseGradeResponse() {}

    public CourseGradeResponse(double numericGrade, String letterGrade, String message) {
        this.numericGrade = numericGrade;
        this.letterGrade = letterGrade;
        this.message = message;
    }

    public double getNumericGrade() { return numericGrade; }
    public void setNumericGrade(double numericGrade) { this.numericGrade = numericGrade; }

    public String getLetterGrade() { return letterGrade; }
    public void setLetterGrade(String letterGrade) { this.letterGrade = letterGrade; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
