package com.koursekit.service;

import com.koursekit.dto.SaveGradeDataRequest;
import com.koursekit.dto.SavedAssessmentDTO;
import com.koursekit.dto.SavedCourseDTO;
import com.koursekit.dto.SavedSemesterResponse;
import com.koursekit.model.SavedAssessment;
import com.koursekit.model.SavedCourse;
import com.koursekit.model.SavedSemester;
import com.koursekit.model.User;
import com.koursekit.repository.SavedSemesterRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavedGradeService {

    private final SavedSemesterRepository semesterRepository;

    public SavedGradeService(SavedSemesterRepository semesterRepository) {
        this.semesterRepository = semesterRepository;
    }

    @Transactional
    public SavedSemesterResponse saveSemester(User user, SaveGradeDataRequest request) {
        SavedSemester semester = new SavedSemester(request.getSemesterName(), user);
        buildCoursesFromRequest(semester, request.getCourses());
        SavedSemester saved = semesterRepository.save(semester);
        return toResponse(saved, "Semester saved successfully");
    }

    public List<SavedSemesterResponse> getSemesters(User user) {
        return semesterRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(s -> toResponse(s, "Success"))
                .collect(Collectors.toList());
    }

    public SavedSemesterResponse getSemesterById(User user, Long semesterId) {
        SavedSemester semester = semesterRepository.findByIdAndUserId(semesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        return toResponse(semester, "Success");
    }

    @Transactional
    public SavedSemesterResponse setTemplate(User user, Long semesterId) {
        semesterRepository.findByUserIdAndIsTemplateTrue(user.getId())
                .ifPresent(s -> { s.setTemplate(false); semesterRepository.save(s); });
        SavedSemester semester = semesterRepository.findByIdAndUserId(semesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        semester.setTemplate(true);
        return toResponse(semesterRepository.save(semester), "Template set");
    }

    @Transactional
    public void clearTemplate(User user, Long semesterId) {
        SavedSemester semester = semesterRepository.findByIdAndUserId(semesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        semester.setTemplate(false);
        semesterRepository.save(semester);
    }

    public java.util.Optional<SavedSemesterResponse> getTemplate(User user) {
        return semesterRepository.findByUserIdAndIsTemplateTrue(user.getId())
                .map(s -> toResponse(s, "Template found"));
    }

    @Transactional
    public void deleteSemester(User user, Long semesterId) {
        SavedSemester semester = semesterRepository.findByIdAndUserId(semesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));
        semesterRepository.delete(semester);
    }

    @Transactional
    public SavedSemesterResponse updateSemester(User user, Long semesterId, SaveGradeDataRequest request) {
        SavedSemester semester = semesterRepository.findByIdAndUserId(semesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Semester not found"));

        semester.setName(request.getSemesterName());
        semester.getCourses().clear();
        buildCoursesFromRequest(semester, request.getCourses());

        SavedSemester saved = semesterRepository.save(semester);
        return toResponse(saved, "Semester updated successfully");
    }

    private void buildCoursesFromRequest(SavedSemester semester, List<SavedCourseDTO> courseDTOs) {
        if (courseDTOs == null) return;
        for (SavedCourseDTO courseDTO : courseDTOs) {
            SavedCourse course = new SavedCourse(
                    courseDTO.getCourseCode(),
                    courseDTO.getGrade(),
                    courseDTO.getCredits(),
                    semester
            );

            if (courseDTO.getAssessments() != null) {
                for (SavedAssessmentDTO assessmentDTO : courseDTO.getAssessments()) {
                    SavedAssessment assessment = new SavedAssessment(
                            assessmentDTO.getName(),
                            assessmentDTO.getGrade(),
                            assessmentDTO.getWeight(),
                            course
                    );
                    course.getAssessments().add(assessment);
                }
            }

            semester.getCourses().add(course);
        }
    }

    private SavedSemesterResponse toResponse(SavedSemester semester, String message) {
        List<SavedCourseDTO> courseDTOs = semester.getCourses().stream()
                .map(course -> {
                    List<SavedAssessmentDTO> assessmentDTOs = course.getAssessments().stream()
                            .map(a -> new SavedAssessmentDTO(a.getName(), a.getGrade(), a.getWeight()))
                            .collect(Collectors.toList());
                    return new SavedCourseDTO(
                            course.getCourseCode(),
                            course.getGrade(),
                            course.getCredits(),
                            assessmentDTOs
                    );
                })
                .collect(Collectors.toList());

        SavedSemesterResponse response = new SavedSemesterResponse(
                semester.getId(),
                semester.getName(),
                courseDTOs,
                semester.getCreatedAt(),
                message
        );
        response.setTemplate(semester.isTemplate());
        return response;
    }
}
