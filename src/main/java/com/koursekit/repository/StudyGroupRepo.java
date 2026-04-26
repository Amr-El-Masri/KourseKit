package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import com.koursekit.model.StudyGroup;

public interface StudyGroupRepo extends JpaRepository<StudyGroup, Long> {
    List<StudyGroup> findByCourse_CourseCodeAndIsPrivateFalse(String courseCode);
    Optional<StudyGroup> findByInviteCode(String inviteCode);
    Optional<StudyGroup> findByInviteCodeIgnoreCase(String inviteCode);
    List<StudyGroup> findByHost_Id(Long hostId);
    boolean existsByNameAndCourse_Id(String name, Long courseId);
    boolean existsByInviteCode(String inviteCode);
}
