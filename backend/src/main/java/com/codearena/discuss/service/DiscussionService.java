package com.codearena.discuss.service;

import java.util.List;

import javax.management.RuntimeErrorException;

import org.springframework.stereotype.Service;

import com.codearena.discuss.dto.CreateDiscussionRequest;
import com.codearena.discuss.dto.CreateReplyRequest;
import com.codearena.discuss.dto.DiscussionResponse;
import com.codearena.discuss.dto.ReplyResponse;
import com.codearena.discuss.entity.Discussion;
import com.codearena.discuss.entity.DiscussionReply;
import com.codearena.discuss.repository.DiscussionReplyRepository;
import com.codearena.discuss.repository.DiscussionRepository;

import lombok.RequiredArgsConstructor;

// TODO: Implement DiscussionService
// Methods:
//   - List<Discussion> getAllDiscussions()
//   - DiscussionResponse getDiscussionById(Long id) â€” includes replies
//   - Discussion createDiscussion(String userId, String username, CreateDiscussionRequest request)
//   - void deleteDiscussion(Long id, String userId)
//   - DiscussionReply addReply(Long discussionId, String userId, String username, CreateReplyRequest request)
//   - void deleteReply(Long discussionId, Long replyId, String userId)

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionReplyRepository replyRepository;

    public Discussion createDiscussion(
            String userId,
            String userName,
            CreateDiscussionRequest request) {

        Discussion discussion = new Discussion();
        discussion.setTitle(request.getTitle());
        discussion.setContent(request.getContent());
        discussion.setTags(request.getTags());
        discussion.setAuthorId(userId);
        discussion.setAuthorUsername(userName);

        discussionRepository.save(discussion);
        return discussion;
    }

    public List<Discussion> getAllDiscussions() {
        return discussionRepository.findAllByOrderByCreatedAtDesc();
    }

    public DiscussionResponse getDiscussionById(Long id) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discussion not found"));

        List<DiscussionReply> replies = replyRepository.findByDiscussionIdOrderByCreatedAtAsc(id);

        List<ReplyResponse> replyResponses = replies.stream()
                .map(r -> new ReplyResponse(r.getId(), r.getContent(), r.getAuthorId(), r.getAuthorUsername(),
                        r.getCreatedAt()))
                .toList();

        return new DiscussionResponse(
                discussion.getId(),
                discussion.getTitle(),
                discussion.getContent(),
                discussion.getTags(),
                discussion.getAuthorId(),
                discussion.getAuthorUsername(),
                discussion.getReplyCount(),
                discussion.getCreatedAt(),
                discussion.getUpdatedAt(),
                replyResponses);
    }

    public void deleteDiscussion(Long id, String userId) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discussion not found"));

        if (!discussion.getAuthorId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this discussion");
        }
        discussionRepository.delete(discussion);
    }

    public ReplyResponse addReply(Long id, String userId, String userName, CreateReplyRequest request) {

        // 1. Verify discussion exists
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discussion not found"));

        // 2. Validate reply content
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new RuntimeException("Reply content cannot be empty");
        }

        DiscussionReply reply = new DiscussionReply();
        reply.setDiscussionId(id);
        reply.setContent(request.getContent().trim());
        reply.setAuthorId(userId);
        reply.setAuthorUsername(userName);

        DiscussionReply savedReply = replyRepository.save(reply);

        int currentCount = discussion.getReplyCount() != null ? discussion.getReplyCount() : 0;

        discussion.setReplyCount(currentCount + 1);
        discussionRepository.save(discussion);

        return new ReplyResponse(
                savedReply.getId(),
                savedReply.getContent(),
                savedReply.getAuthorId(),
                savedReply.getAuthorUsername(),
                savedReply.getCreatedAt());
    }

    public void deleteReply(Long id, Long replyId, String userId) {

        // Verify discussion exists
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        // verify reply exists
        DiscussionReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        if (!reply.getDiscussionId().equals(id)) {
            throw new RuntimeException("Reply does not belong to this discussion");
        }

        // Authorization: only the reply author (or thread creator) can delete it
        if (!reply.getAuthorId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this reply");
        }

        replyRepository.delete(reply);

        int currentCount = discussion.getReplyCount() != null ? discussion.getReplyCount() : 0;

        if (currentCount > 0) {
            discussion.setReplyCount(currentCount - 1);
        } else {
            discussion.setReplyCount(0);
        }
        
        discussionRepository.save(discussion);
    }
}