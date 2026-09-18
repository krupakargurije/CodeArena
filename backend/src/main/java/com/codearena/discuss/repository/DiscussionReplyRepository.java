package com.codearena.discuss.repository;

// TODO: Implement DiscussionReplyRepository
// Extends JpaRepository<DiscussionReply, Long>
// Custom queries: findByDiscussionIdOrderByCreatedAtAsc(Long discussionId)

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codearena.discuss.entity.DiscussionReply;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, Long> {
    List<DiscussionReply> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);
}