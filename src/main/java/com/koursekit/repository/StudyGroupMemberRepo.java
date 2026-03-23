package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.koursekit.model.StudyGroupMember;

public interface StudyGroupMemberRepo extends JpaRepository<StudyGroupMember, Long>{
    List<StudyGroupMember> findByStudyGroup_Id(Long groupId);
    List<StudyGroupMember> findByUser_Id(Long userID);
    List<StudyGroupMember> findByStudyGroup_IdAndUser_Id(Long groupId, Long userID);
    boolean existsByStudyGroup_IdAndUser_Id(Long groupId, Long userID);
    int countByStudyGroup_Id(Long groupId);

    @Modifying
    @Query("DELETE FROM StudyGroupMember member WHERE member.studyGroup.id = :groupId AND member.user.id = :userId")
    void deleteByStudyGroup_IdAndUser_Id(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM StudyGroupMember member WHERE member.studyGroup.id = :groupId")
    void deleteAll_byStudyGroupId(@Param("groupId") Long groupId);

    @Query("SELECT member.studyGroup.id, COUNT(member) FROM StudyGroupMember member WHERE member.studyGroup.id IN :groupIds GROUP BY member.studyGroup.id")
    List<Object[]> countMembersByGroupIds(@Param("groupIds") List<Long> groupIds);
}
