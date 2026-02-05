package com.koursekit.service;

import com.koursekit.dto.*;
import com.koursekit.model.GPACalculator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GPAService {

    public double calculateSemesterGPA(SemesterGPARequest request) {
        List<GPACalculator.Course> courses = request.getCourses().stream()
            .map(dto -> new GPACalculator.Course(dto.getCourseCode(), dto.getGrade(), dto.getCredits()))
            .collect(Collectors.toList());

        return GPACalculator.calculateSemesterGPA(courses);
    }

    public CumulativeGPAResponse calculateCumulativeGPA(CumulativeGPARequest request) {
        List<GPACalculator.Semester> semesters = request.getSemesters().stream()
            .map(dto -> new GPACalculator.Semester(dto.getSemesterName(), dto.getGpa(), dto.getCredits()))
            .collect(Collectors.toList());

        double cgpa = GPACalculator.calculateCumulativeGPA(semesters);

        int totalCredits = semesters.stream()
            .mapToInt(s -> s.credits)
            .sum();

        return new CumulativeGPAResponse(cgpa, totalCredits, "Success");
    }

    public CourseGradeResponse calculateCourseGrade(CourseGradeRequest request) {
        List<GPACalculator.Assessment> assessments = request.getAssessments().stream()
            .map(dto -> new GPACalculator.Assessment(dto.getName(), dto.getGrade(), dto.getWeight()))
            .collect(Collectors.toList());

        double numericGrade = GPACalculator.calculateCourseGrade(assessments);
        String letterGrade = GPACalculator.numericToLetterGrade(numericGrade);

        return new CourseGradeResponse(numericGrade, letterGrade, "Success");
    }

    public SimulationResponse simulateGradeChange(SimulationRequest request) {
        List<GPACalculator.Assessment> assessments = request.getModifiedAssessments().stream()
            .map(dto -> new GPACalculator.Assessment(dto.getName(), dto.getGrade(), dto.getWeight()))
            .collect(Collectors.toList());

        List<GPACalculator.Course> courses = request.getAllCourses().stream()
            .map(dto -> new GPACalculator.Course(dto.getCourseCode(), dto.getGrade(), dto.getCredits()))
            .collect(Collectors.toList());

        GPACalculator.SimulationResult result = GPACalculator.simulateGradeChange(
            assessments, courses, request.getCourseIndex()
        );

        return new SimulationResponse(
            result.simulatedCourseGrade,
            result.simulatedLetterGrade,
            result.simulatedSemesterGPA,
            result.gpaChange,
            "Success"
        );
    }

    public RequiredFinalGradeResponse calculateRequiredFinalGrade(RequiredFinalGradeRequest request) {
        List<GPACalculator.Assessment> assessments = request.getCompletedAssessments().stream()
            .map(dto -> new GPACalculator.Assessment(dto.getName(), dto.getGrade(), dto.getWeight()))
            .collect(Collectors.toList());

        GPACalculator.FinalGradeRequirement result = GPACalculator.calculateRequiredFinalGrade(
            assessments,
            request.getFinalExamWeight(),
            request.getTargetCourseGrade()
        );

        return new RequiredFinalGradeResponse(
            result.requiredFinalGrade,
            result.isAchievable,
            result.message,
            result.targetLetterGrade
        );
    }

    public Map<String, String> getGradeBoundaries() {
        return GPACalculator.getGradeBoundaries();
    }

    public HighestImpactResponse findHighestImpactCourse(HighestImpactRequest request) {
        List<GPACalculator.Course> courses = request.getCourses().stream()
            .map(dto -> new GPACalculator.Course(dto.getCourseCode(), dto.getGrade(), dto.getCredits()))
            .collect(Collectors.toList());

        int index = GPACalculator.findHighestImpactCourse(courses);

        if (index == -1) {
            return new HighestImpactResponse(-1, "", "", 0, "No valid courses found");
        }

        SemesterGPARequest.CourseDTO course = request.getCourses().get(index);
        String message = String.format("Course '%s' has the highest impact on your GPA (%d credits, grade %s)",
            course.getCourseCode(), course.getCredits(), course.getGrade());

        return new HighestImpactResponse(index, course.getCourseCode(), course.getGrade(), course.getCredits(), message);
    }

    public RequiredFutureGPAResponse calculateRequiredFutureGPA(RequiredFutureGPARequest request) {
        double requiredGPA = GPACalculator.calculateRequiredFutureGPA(
            request.getCurrentCGPA(),
            request.getCompletedCredits(),
            request.getTargetCGPA(),
            request.getRemainingCredits()
        );

        boolean isAchievable = requiredGPA >= 0.0 && requiredGPA <= 4.3;
        String message;

        if (requiredGPA < 0) {
            message = String.format("You've already exceeded your target CGPA of %.2f!", request.getTargetCGPA());
        } else if (requiredGPA > 4.3) {
            message = String.format("Target CGPA of %.2f is not achievable. You would need a %.2f GPA in remaining credits.",
                request.getTargetCGPA(), requiredGPA);
        } else {
            message = String.format("You need a %.2f GPA in your remaining %d credits to achieve a %.2f CGPA",
                requiredGPA, request.getRemainingCredits(), request.getTargetCGPA());
        }

        return new RequiredFutureGPAResponse(requiredGPA, isAchievable, message);
    }
}
