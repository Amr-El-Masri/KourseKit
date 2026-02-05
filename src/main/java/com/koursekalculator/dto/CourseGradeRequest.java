package com.koursekalculator.dto;

import java.util.List;

public class CourseGradeRequest {
    private List<AssessmentDTO> assessments;

    public CourseGradeRequest() {}

    public List<AssessmentDTO> getAssessments() { return assessments; }
    public void setAssessments(List<AssessmentDTO> assessments) { this.assessments = assessments; }
}
