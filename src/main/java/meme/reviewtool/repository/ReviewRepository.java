package meme.reviewtool.repository;

import meme.reviewtool.model.Review;
import meme.reviewtool.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // This is the "Gatekeeper" method for your View Reviews page
    List<Review> findBySectionCourseIdAndStatus(Long courseId, ReviewStatus status);
    List<Review> findBySectionIdAndStatus(Long sectionId, ReviewStatus status);

}