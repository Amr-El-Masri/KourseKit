package com.koursekit.repository;

import com.koursekit.model.UserTranscriptInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserTranscriptInfoRepository extends JpaRepository<UserTranscriptInfo, Long> {
    Optional<UserTranscriptInfo> findByUserId(Long userId);

    @Transactional
    void deleteByUserId(Long userId);
}
