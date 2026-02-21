package com.koursekit.repository;

import com.koursekit.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository  extends JpaRepository<Task, Long> {

    List<Task> findByDeadlineBetween(LocalDateTime now, LocalDateTime oneDayLater);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Task t WHERE t.course = :course AND t.title = :title AND t.user.id = :userId")
    boolean existsByCourseAndTitleAndUserId(@Param("course") String course, @Param("title") String title, @Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Task t WHERE t.deadline < :now AND t.user.id = :userId " +
            "AND t.id NOT IN (SELECT e.task.id FROM StudyPlanEntry e)")
    void deleteTasksPastDeadline(@Param("now") LocalDateTime now, @Param("userId") Long userId);



    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.course) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Task> searchByUserIdAndKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);

    @Query("SELECT DISTINCT t.user.id FROM Task t WHERE t.deadline < :now")
    List<Long> findDistinctUserIdsWithExpiredTasks(@Param("now") LocalDateTime now);


    // Do this:
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId ORDER BY t.deadline ASC, t.course ASC, t.title ASC")
    List<Task> findByUserIdOrderByDeadlineAscCourseAscTitleAsc(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.course = :course ORDER BY t.deadline ASC, t.title ASC")
    List<Task> findByUserIdAndCourseOrderByDeadlineAscTitleAsc(@Param("userId") Long userId, @Param("course") String course);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId")
    List<Task> findByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.deadline < :now")
    List<Task> findByUserIdAndDeadlineBefore(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
