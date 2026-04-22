package com.koursekit.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.koursekit.model.PassHistory;
import com.koursekit.model.User;

public interface PassRepo extends JpaRepository<PassHistory, Long> {
    List<PassHistory> findByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM PassHistory h WHERE h.user = :user")
    void deleteByUser(@Param("user") User user);
}
