package com.koursekit.repository;

import com.koursekit.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserSessionRepo extends JpaRepository<UserSession, String> {
    List<UserSession> findByUserId(Long userId);
    @Transactional
    void deleteByUserId(Long userId);
    @Transactional
    void deleteByUserIdAndDeviceName(Long userId, String deviceName);
}
