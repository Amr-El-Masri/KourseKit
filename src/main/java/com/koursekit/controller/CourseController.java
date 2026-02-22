package com.koursekit.controller;

import com.koursekit.model.Course;
import com.koursekit.model.Section;
import com.koursekit.repository.CourseRepository;
import com.koursekit.repository.SectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
}
