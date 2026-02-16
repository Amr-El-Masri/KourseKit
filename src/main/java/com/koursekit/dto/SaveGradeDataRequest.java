package com.koursekit.dto;

import java.util.List;

public class SaveGradeDataRequest {
    private String semesterName;
    private List<SavedCourseDTO> courses;

    public SaveGradeDataRequest() {}

    public String getSemesterName() { 
        return semesterName; 
    }
    public void setSemesterName(String semesterName) { 
        this.semesterName = semesterName;
     }

    public List<SavedCourseDTO> getCourses() { 
        return courses; 
    }
    public void setCourses(List<SavedCourseDTO> courses) { 
        this.courses = courses;
     }
}
