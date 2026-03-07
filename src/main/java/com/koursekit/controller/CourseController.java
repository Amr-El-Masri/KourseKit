package com.koursekit.controller;

import com.koursekit.model.Course;
import com.koursekit.model.Section;
import com.koursekit.repository.CourseRepository;
import com.koursekit.repository.SectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    @Autowired private CourseRepository courseRepo;
    @Autowired private SectionRepository sectionRepo;

    // Search courses by code or title
    @GetMapping("/search")
    public List<Course> search(@RequestParam String query) {
        return courseRepo.findByCourseCodeContainingIgnoreCaseOrTitleContainingIgnoreCase(query, query);
    }

    // Get sections for a specific course
    @GetMapping("/{courseId}/sections")
    public List<Section> getSections(@PathVariable Long courseId) {
        return sectionRepo.findByCourseId(courseId);
    }

    // GET http://localhost:8080/api/courses/professors?query=sakr
    @GetMapping("/professors")
    public List<String> searchProfessors(@RequestParam String query) {
        return sectionRepo.findDistinctProfessorNamesByQuery(query);
    }

    // GET http://localhost:8080/api/courses/{courseId}
    @GetMapping("/{courseId}")
    public ResponseEntity<?> getCourseDetails(@PathVariable Long courseId) {
        return courseRepo.findById(courseId)
                .map(course -> {
                    List<Section> sections = sectionRepo.findByCourseId(courseId);
                    java.util.Map<String, Object> response = new java.util.LinkedHashMap<>();
                    response.put("id", course.getId());
                    response.put("courseCode", course.getCourseCode());
                    response.put("title", course.getTitle());
                    response.put("sections", sections);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
