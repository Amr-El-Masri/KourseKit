package com.koursekit.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ForumPost;
import com.koursekit.model.ForumRelate;
import com.koursekit.model.ReviewStatus;
import com.koursekit.repository.ForumCommentRepository;
import com.koursekit.repository.ForumPostRepository;
import com.koursekit.repository.ForumRelateRepository;

import jakarta.transaction.Transactional;

@Service
public class ForumService {

    @Autowired private ForumPostRepository postRepo;
    @Autowired private ForumCommentRepository commentRepo;
    @Autowired private ContentFilterService contentFilterService;
    @Autowired private ForumRelateRepository relateRepo;

    // ─── POSTS ───────────────────────────────────────────────

    public ForumPost createPost(String userId, String displayName, String title,
                                String body, String category,
                                String courseTag, String professorTag) {

        // Pick the right context based on category
        ContentFilterService.ContentContext ctx = switch (category.toUpperCase()) {
            case "COURSE"    -> ContentFilterService.ContentContext.FORUM_COURSE;
            case "PROFESSOR" -> ContentFilterService.ContentContext.FORUM_PROFESSOR;
            default          -> ContentFilterService.ContentContext.FORUM_GENERAL;
        };

        // Filter title and body separately with the correct context
        ContentFilterService.FilterResult titleResult = contentFilterService.filter(title, ctx);
        ContentFilterService.FilterResult bodyResult  = contentFilterService.filter(body,  ctx);

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

        ContentFilterService.FilterResult result = contentFilterService.filter(
                body, ContentFilterService.ContentContext.FORUM_COMMENT);

        ForumComment comment = new ForumComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setDisplayName(displayName);
        comment.setBody(result.comment);
        comment.setStatus(ReviewStatus.valueOf(result.status));

        ForumComment saved = commentRepo.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepo.save(post);

        return saved;
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

    @Transactional
    public ForumPost relate(Long postId, String userId) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        if (relateRepo.existsByUserIdAndPostId(userId, postId)) {
            // Already liked — unlike it
            relateRepo.deleteByUserIdAndPostId(userId, postId);
            post.setRelateCount(Math.max(0, post.getRelateCount() - 1));
        } else {
            // Not liked yet — like it
            ForumRelate relate = new ForumRelate();
            relate.setUserId(userId);
            relate.setPostId(postId);
            relateRepo.save(relate);
            post.setRelateCount(post.getRelateCount() + 1);
        }

        return postRepo.save(post);
    }
}