package com.koursekit.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.PassHistory;
import com.koursekit.model.User;

public interface PassRepo extends JpaRepository<PassHistory, Long> {
    List<PassHistory> findByUser(User user);
}
