package com.koursekit.service;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ForumPost;
import com.koursekit.model.ReviewStatus;
import com.koursekit.repository.ForumCommentRepository;
import com.koursekit.repository.ForumPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ForumService {

    @Autowired private ForumPostRepository postRepo;
    @Autowired private ForumCommentRepository commentRepo;
    @Autowired private ContentFilterService contentFilterService;

    // ─── POSTS ───────────────────────────────────────────────

    public ForumPost createPost(String userId, String displayName, String title,
                                String body, String category,
                                String courseTag, String professorTag) {

        // Filter title and body separately
        ContentFilterService.FilterResult titleResult = contentFilterService.filter(title);
        ContentFilterService.FilterResult bodyResult  = contentFilterService.filter(body);

        // Use the stricter of the two verdicts
        String status = stricterVerdict(titleResult.status, bodyResult.status);

        ForumPost post = new ForumPost();
        post.setUserId(userId);
        post.setDisplayName(displayName);
        post.setTitle(titleResult.comment);
        post.setBody(bodyResult.comment);
        post.setCategory(category.toUpperCase());
        post.setCourseTag(courseTag);
        post.setProfessorTag(professorTag);
        post.setStatus(ReviewStatus.valueOf(status));

        return postRepo.save(post);
    }

    public List<ForumPost> getAllPosts() {
        return postRepo.findByStatusOrderByCreatedAtDesc(ReviewStatus.APPROVED);
    }

    public List<ForumPost> getPostsByCategory(String category) {
        return postRepo.findByCategoryAndStatusOrderByCreatedAtDesc(
                category.toUpperCase(), ReviewStatus.APPROVED);
    }

    public List<ForumPost> getPostsByCourseTag(String courseTag) {
        return postRepo.findByCourseTagAndStatusOrderByCreatedAtDesc(
                courseTag, ReviewStatus.APPROVED);
    }

    public List<ForumPost> getPostsByProfessorTag(String professorTag) {
        return postRepo.findByProfessorTagAndStatusOrderByCreatedAtDesc(
                professorTag, ReviewStatus.APPROVED);
    }

    public ForumPost getPostById(Long postId) {
        return postRepo.findById(postId)
                .filter(p -> p.getStatus() == ReviewStatus.APPROVED)
                .orElseThrow(() -> new RuntimeException("Post not found."));
    }

    public ForumPost relate(Long postId, String userId) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));
        post.setRelateCount(post.getRelateCount() + 1);
        return postRepo.save(post);
    }

    public void deletePost(Long postId, String userId, boolean isAdmin) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));
        if (!isAdmin && !post.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts.");
        }
        postRepo.delete(post);
    }

    // ─── COMMENTS ────────────────────────────────────────────

    public ForumComment createComment(Long postId, String userId,
                                      String displayName, String body) {

        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        ContentFilterService.FilterResult result = contentFilterService.filter(body);

        ForumComment comment = new ForumComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setDisplayName(displayName);
        comment.setBody(result.comment);
        comment.setStatus(ReviewStatus.valueOf(result.status));

        return commentRepo.save(comment);
    }

    public List<ForumComment> getCommentsForPost(Long postId) {
        return commentRepo.findByPostIdAndStatusOrderByCreatedAtAsc(
                postId, ReviewStatus.APPROVED);
    }

    public void deleteComment(Long commentId, String userId, boolean isAdmin) {
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found."));
        if (!isAdmin && !comment.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own comments.");
        }
        commentRepo.delete(comment);
    }

    // ─── HELPERS ─────────────────────────────────────────────

    // Returns the stricter of two verdicts: FLAGGED > PENDING > APPROVED
    private String stricterVerdict(String a, String b) {
        if ("FLAGGED".equals(a) || "FLAGGED".equals(b)) return "FLAGGED";
        if ("PENDING".equals(a) || "PENDING".equals(b)) return "PENDING";
        return "APPROVED";
    }
}