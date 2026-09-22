package com.codearena.discuss.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.codearena.discuss.dto.CreateDiscussionRequest;
import com.codearena.discuss.dto.CreateReplyRequest;
import com.codearena.discuss.dto.ReplyResponse;
import com.codearena.discuss.service.DiscussionService;

// Endpoints:
//   GET    /api/discussions                                  â€” getAllDiscussions()
//   GET    /api/discussions/{id}                             â€” getDiscussionById(id) â€” returns discussion + replies
//   POST   /api/discussions?userId={userId}&username={username} â€” createDiscussion(userId, username, body)
//   DELETE /api/discussions/{id}?userId={userId}             â€” deleteDiscussion(id, userId)
//   POST   /api/discussions/{id}/replies?userId={userId}&username={username} â€” addReply(id, userId, username, body)
//   DELETE /api/discussions/{id}/replies/{replyId}?userId={userId} â€” deleteReply(id, replyId, userId)

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DiscussionController {

    private final DiscussionService discussionService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiscussionById(@PathVariable Long id) {
        return ResponseEntity.ok(discussionService.getDiscussionById(id));
    }

    @GetMapping
    public ResponseEntity<?> getAllDiscussions() {
        return ResponseEntity.ok(discussionService.getAllDiscussions());
    }

    // Create Discussion
    @PostMapping
    public ResponseEntity<?> createDiscussion(
            @RequestParam String userId,
            @RequestParam String username,
            @RequestBody CreateDiscussionRequest request) {

        return ResponseEntity.ok(discussionService.createDiscussion(userId, username, request));
    }

    // Delete Discussion By Id
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteDiscussion(@PathVariable Long id, @RequestParam String userId) {
        discussionService.deleteDiscussion(id, userId);
        return ResponseEntity.ok().build();
    }

    // Reply API
    @PostMapping("/{id}/replies")
    public ResponseEntity<ReplyResponse> addReply(
            @PathVariable Long id,
            @RequestParam String userId,
            @RequestParam String username,
            @RequestBody CreateReplyRequest request) {
        ReplyResponse reply = discussionService.addReply(id, userId, username, request);
        return ResponseEntity.ok(reply);
    }

    // Delete Discussion reply
    @DeleteMapping("/{id}/replies/{replyId}")
    public ResponseEntity<Object> deleteReply(
            @PathVariable Long id,
            @PathVariable Long replyId,
            @RequestParam String userId) {

        discussionService.deleteReply(id, replyId, userId);
        return ResponseEntity.ok().build();
    }
}