package com.koursekit.dto;

import java.util.List;

public class RequiredFinalGradeRequest {
    private List<AssessmentDTO> completedAssessments;
    private double finalExamWeight;
    private double targetCourseGrade;

    public RequiredFinalGradeRequest() {}

    public List<AssessmentDTO> getCompletedAssessments() { return completedAssessments; }
    public void setCompletedAssessments(List<AssessmentDTO> completedAssessments) {
        this.completedAssessments = completedAssessments;
    }

    public double getFinalExamWeight() { return finalExamWeight; }
    public void setFinalExamWeight(double finalExamWeight) { this.finalExamWeight = finalExamWeight; }

    public double getTargetCourseGrade() { return targetCourseGrade; }
    public void setTargetCourseGrade(double targetCourseGrade) { this.targetCourseGrade = targetCourseGrade; }
}
