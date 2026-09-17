package com.codearena.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.codearena.dto.CreateDiscussionRequest;
import com.codearena.dto.DiscussionResponse;
import com.codearena.dto.ReplyResponse;
import com.codearena.entity.Discussion;
import com.codearena.entity.DiscussionReply;
import com.codearena.repository.DiscussionReplyRepository;
import com.codearena.repository.DiscussionRepository;

import lombok.RequiredArgsConstructor;

// TODO: Implement DiscussionService
// Methods:
//   - List<Discussion> getAllDiscussions()
//   - DiscussionResponse getDiscussionById(Long id) — includes replies
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
}