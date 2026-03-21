package com.koursekit.dto;

import java.util.List;

import com.koursekit.model.Section;

public class SavedCourseDTO {
    private String courseCode;
    private String grade;
    private int credits;
    private List<SavedAssessmentDTO> assessments;
    private String sectioncrn;
    private Section section;

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

    public String getsectioncrn() { return sectioncrn; }
    public void setsectioncrn(String sectioncrn) { this.sectioncrn = sectioncrn; }
    public Section getsection() { return section; }
    public void setsection(Section section) { this.section = section; }
}
