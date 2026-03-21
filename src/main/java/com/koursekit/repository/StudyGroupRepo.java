package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import com.koursekit.model.StudyGroup;

public interface StudyGroupRepo extends JpaRepository<StudyGroup, Long> {
    List<StudyGroup> findByCourse_IdAndIsPrivateFalse(Long courseId); //if public, can be found by courseId only
    Optional<StudyGroup> findByInviteCode(String inviteCode); //for private groups
    List<StudyGroup> findByHost_Id(Long hostId); //for groups hosted by a user
    boolean existsByNameAndCourse_Id(String name, Long courseId); //checking to see if it exists before creating a new group with the same name in the same course
    boolean existsByInviteCode(String inviteCode); //checking to see if the invite code is unique
}
