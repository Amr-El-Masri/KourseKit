package meme.reviewtool.repository;

import meme.reviewtool.model.Section;
import meme.reviewtool.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, Long> {
    boolean existsByCrn(String crn);
}