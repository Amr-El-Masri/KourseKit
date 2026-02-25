package com.koursekit.dto;

public class CourseGradeResponse {
    private double grade;
    private String letterGrade;
    private String message;

    public CourseGradeResponse() {}

    public CourseGradeResponse(double grade, String letterGrade, String message) {
        this.grade = grade;
        this.letterGrade = letterGrade;
        this.message = message;
    }

    public double getGrade() {
        return grade;
    }
    public void setGrade(double grade) {
        this.grade = grade;
    }

    public String getLetterGrade() { 
        return letterGrade; 
    }
    public void setLetterGrade(String letterGrade) {
         this.letterGrade = letterGrade; 
        }

    public String getMessage() {
         return message;
         }
    public void setMessage(String message) { 
        this.message = message; 
    }
}
