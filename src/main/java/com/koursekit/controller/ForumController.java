package com.koursekit.controller;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ForumPost;
import com.koursekit.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    @Autowired private ForumService forumService;

    // ─── POSTS ───────────────────────────────────────────────

    // GET /api/forum/posts  — all approved posts
    @GetMapping("/posts")
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // GET /api/forum/posts?category=COURSE
    @GetMapping("/posts/category/{category}")
    public List<ForumPost> getByCategory(@PathVariable String category) {
        return forumService.getPostsByCategory(category);
    }

    // GET /api/forum/posts/course/{courseTag}
    @GetMapping("/posts/course/{courseTag}")
    public List<ForumPost> getByCourse(@PathVariable String courseTag) {
        return forumService.getPostsByCourseTag(courseTag);
    }

    // GET /api/forum/posts/professor/{professorTag}
    @GetMapping("/posts/professor/{professorTag}")
    public List<ForumPost> getByProfessor(@PathVariable String professorTag) {
        return forumService.getPostsByProfessorTag(professorTag);
    }

    // GET /api/forum/posts/{postId}
    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId) {
        try {
            return ResponseEntity.ok(forumService.getPostById(postId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/forum/posts
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @RequestParam String userId,
            @RequestParam String displayName,
            @RequestParam String title,
            @RequestParam String body,
            @RequestParam String category,
            @RequestParam(required = false) String courseTag,
            @RequestParam(required = false) String professorTag) {
        try {
            ForumPost post = forumService.createPost(
                    userId, displayName, title, body, category, courseTag, professorTag);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/forum/posts/{postId}/relate
    @PostMapping("/posts/{postId}/relate")
    public ResponseEntity<?> relate(@PathVariable Long postId,
                                    @RequestParam String userId) {
        try {
            return ResponseEntity.ok(forumService.relate(postId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/forum/posts/{postId}
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId,
                                        @RequestParam String userId,
                                        Authentication auth) {
        try {
            boolean isAdmin = auth != null &&
                    auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            forumService.deletePost(postId, userId, isAdmin);
            return ResponseEntity.ok("Post deleted.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── COMMENTS ────────────────────────────────────────────

    // GET /api/forum/posts/{postId}/comments
    @GetMapping("/posts/{postId}/comments")
    public List<ForumComment> getComments(@PathVariable Long postId) {
        return forumService.getCommentsForPost(postId);
    }

    // POST /api/forum/posts/{postId}/comments
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            @RequestParam String userId,
            @RequestParam String displayName,
            @RequestParam String body) {
        try {
            ForumComment comment = forumService.createComment(
                    postId, userId, displayName, body);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/forum/comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId,
                                           @RequestParam String userId,
                                           Authentication auth) {
        try {
            boolean isAdmin = auth != null &&
                    auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            forumService.deleteComment(commentId, userId, isAdmin);
            return ResponseEntity.ok("Comment deleted.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}