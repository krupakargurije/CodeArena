package com.codearena.problems.repository;

import com.codearena.problems.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByProblemIdOrderBySubmittedAtDesc(Long problemId);

    List<Submission> findByUserId(String userId);

    List<Submission> findByUserIdAndProblemId(String userId, Long problemId);

    Optional<Submission> findFirstByStatusOrderBySubmittedAtAsc(Submission.Status status);

    List<Submission> findBySubmittedAtAfterOrderBySubmittedAtAsc(LocalDateTime after);

    long countByStatus(Submission.Status status);

    long countByStatusIn(List<Submission.Status> statuses);

    long countBySubmittedAtAfter(LocalDateTime after);
}
