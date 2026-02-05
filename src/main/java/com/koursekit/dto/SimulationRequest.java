package com.koursekit.dto;

import java.util.List;

public class SimulationRequest {
    private List<AssessmentDTO> modifiedAssessments;
    private List<SemesterGPARequest.CourseDTO> allCourses;
    private int courseIndex;

    public SimulationRequest() {}

    public List<AssessmentDTO> getModifiedAssessments() { return modifiedAssessments; }
    public void setModifiedAssessments(List<AssessmentDTO> modifiedAssessments) {
        this.modifiedAssessments = modifiedAssessments;
    }

    public List<SemesterGPARequest.CourseDTO> getAllCourses() { return allCourses; }
    public void setAllCourses(List<SemesterGPARequest.CourseDTO> allCourses) {
        this.allCourses = allCourses;
    }

    public int getCourseIndex() { return courseIndex; }
    public void setCourseIndex(int courseIndex) { this.courseIndex = courseIndex; }
}
