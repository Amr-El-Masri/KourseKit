package com.koursekit.dto;

import java.util.List;

public class SavedCourseDTO {
    private String courseCode;
    private String grade;
    private int credits;
    private List<SavedAssessmentDTO> assessments;

    public SavedCourseDTO() {}

    public SavedCourseDTO(String courseCode, String grade, int credits, List<SavedAssessmentDTO> assessments) {
        this.courseCode = courseCode;
        this.grade = grade;
        this.credits = credits;
        this.assessments = assessments;
    }

    public String getCourseCode() { 
        return courseCode; 
    }
    public void setCourseCode(String courseCode) { 
        this.courseCode = courseCode; 
    }

    public String getGrade() { 
        return grade;
     }
    public void setGrade(String grade) {
         this.grade = grade; 
        }

    public int getCredits() { 
        return credits;
     }
    public void setCredits(int credits) { 
        this.credits = credits; 
    }

    public List<SavedAssessmentDTO> getAssessments() {
         return assessments; 
        }
    public void setAssessments(List<SavedAssessmentDTO> assessments) { 
        this.assessments = assessments; 
    }
}
