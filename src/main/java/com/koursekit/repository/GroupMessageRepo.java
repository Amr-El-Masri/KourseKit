package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.koursekit.model.GroupMessage;

public interface GroupMessageRepo extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByStudyGroup_IdOrderBySentAtAsc(Long groupId);
    List<GroupMessage> findByStudyGroup_IdAndIsDeletedFalseOrderBySentAtAsc(Long groupId);

    @Modifying
    @Query("DELETE FROM GroupMessage message WHERE message.studyGroup.id = :groupId")
    void deleteAll_byStudyGroupID(@Param("groupId") Long groupId);
}
