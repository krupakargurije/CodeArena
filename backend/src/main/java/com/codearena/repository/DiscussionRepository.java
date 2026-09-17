package com.codearena.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codearena.entity.Discussion;

// TODO: Implement DiscussionRepository
// Extends JpaRepository<Discussion, Long>
// Custom queries: findAllByOrderByCreatedAtDesc(), findByAuthorId(String authorId)

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    List<Discussion> findAllByOrderByCreatedAtDesc();
    List<Discussion> findByAuthorId(String authorId);
}