package com.koursekit.repository;

import com.koursekit.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository  extends JpaRepository<Task, Long> {

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Task t WHERE t.course = :course AND t.title = :title")
    boolean existsByCourseAndTitle(@Param("course") String course, @Param("title") String title);

    List<Task> findAllByOrderByDeadlineAscCourseAscTitleAsc();

    List<Task> findAllByCourseOrderByDeadlineAscTitleAsc(String course);

    List<Task> findByDeadlineBetween(LocalDateTime now, LocalDateTime oneDayLater);





}
