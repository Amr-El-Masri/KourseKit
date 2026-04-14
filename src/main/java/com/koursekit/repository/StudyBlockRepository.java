package com.koursekit.repository;

import com.koursekit.model.StudyBlock;
import com.koursekit.model.StudyPlanEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface StudyBlockRepository extends JpaRepository<StudyBlock, Long> {

    List<StudyBlock> findByStudyPlanEntry(StudyPlanEntry entry);

    List<StudyBlock> findByStudyPlanEntry_User_IdAndDayBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<StudyBlock> findByStudyPlanEntry_User_IdAndDayBetweenAndStudyPlanEntry_SemesterName(
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            String semesterName
    );

    // Used by rebalance to load only completed blocks for an entry
    List<StudyBlock> findByStudyPlanEntryAndCompleted(StudyPlanEntry entry, boolean completed);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false")
    void deleteByStudyPlanEntryAndCompletedFalse(@Param("entry") StudyPlanEntry entry);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false AND b.pinned = false")
    void deleteByStudyPlanEntryAndCompletedFalseAndPinnedFalse(@Param("entry") StudyPlanEntry entry);

    @Query("SELECT b FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.pinned = true AND b.completed = false")
    List<StudyBlock> findPinnedUncompletedByEntry(@Param("entry") StudyPlanEntry entry);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false AND b.day BETWEEN :from AND :to")
    void deleteByStudyPlanEntryAndCompletedFalseAndDayBetween(
            @Param("entry") StudyPlanEntry entry,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false AND b.day >= :fromDate")
    void deleteByStudyPlanEntryAndCompletedFalseAndDayGreaterThanEqual(
            @Param("entry") StudyPlanEntry entry,
            @Param("fromDate") LocalDate fromDate
    );

    @Query("SELECT b FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false AND b.day < :fromDate")
    List<StudyBlock> findPastUncompletedBlocks(
            @Param("entry") StudyPlanEntry entry,
            @Param("fromDate") LocalDate fromDate
    );

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry.user.id = :userId AND b.studyPlanEntry.weekStart = :weekStart")
    void deleteAllByUserIdAndWeekStart(@Param("userId") Long userId, @Param("weekStart") LocalDate weekStart);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry.user.id = :userId AND b.studyPlanEntry.weekStart = :weekStart AND b.studyPlanEntry.semesterName = :semester")
    void deleteAllByUserIdAndWeekStartAndSemester(@Param("userId") Long userId, @Param("weekStart") LocalDate weekStart, @Param("semester") String semester);

    @Query("SELECT b FROM StudyBlock b WHERE b.studyPlanEntry.user.id = :userId AND b.completed = false AND b.day >= :weekStart AND (b.day < :today OR (b.day = :today AND b.startTime < :cutoffTime)) AND (:semester IS NULL OR b.studyPlanEntry.semesterName = :semester)")
    List<StudyBlock> findAllPastUncompletedForUser(
            @Param("userId") Long userId,
            @Param("weekStart") LocalDate weekStart,
            @Param("today") LocalDate today,
            @Param("cutoffTime") java.time.LocalTime cutoffTime,
            @Param("semester") String semester
    );

    @Modifying
    @Query("UPDATE StudyBlock b SET b.completed = true WHERE b.id IN :ids")
    void markAllCompletedByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry.id IN :entryIds AND b.completed = false AND b.day BETWEEN :from AND :to")
    void deleteUncompletedByEntryIdsAndDayBetween(@Param("entryIds") List<Long> entryIds, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry.id IN :entryIds AND b.completed = false AND b.pinned = false")
    void deleteUncompletedUnpinnedByEntryIds(@Param("entryIds") List<Long> entryIds);

    @Query("SELECT b FROM StudyBlock b WHERE b.studyPlanEntry.id IN :entryIds AND b.completed = true")
    List<StudyBlock> findCompletedByEntryIds(@Param("entryIds") List<Long> entryIds);

    @Query("SELECT b FROM StudyBlock b WHERE b.studyPlanEntry.id IN :entryIds AND b.pinned = true AND b.completed = false")
    List<StudyBlock> findPinnedUncompletedByEntryIds(@Param("entryIds") List<Long> entryIds);
}