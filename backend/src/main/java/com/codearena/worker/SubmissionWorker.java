package com.codearena.worker;

import com.codearena.entity.Submission;
import com.codearena.repository.SubmissionRepository;
import com.codearena.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Background worker that polls the submissions table for PENDING jobs
 * and processes them through Judge0, mimicking a message queue consumer.
 */
@Component
@RequiredArgsConstructor
public class SubmissionWorker {

    private final SubmissionRepository submissionRepository;
    private final SubmissionService submissionService;

    /**
     * Polls every 2 seconds for PENDING submissions and processes them.
     * This is a simple single-threaded worker — in production, you'd use
     * a proper message queue (RabbitMQ, Kafka) with multiple consumers.
     */
    @Scheduled(fixedDelay = 2000)
    public void pollAndProcess() {
        Optional<Submission> pending = submissionRepository
                .findFirstByStatusOrderBySubmittedAtAsc(Submission.Status.PENDING);

        if (pending.isPresent()) {
            Submission submission = pending.get();
            System.out.println("[Worker] Picked up submission " + submission.getId() + " for processing");

            try {
                submissionService.processSubmission(submission.getId());
            } catch (Exception e) {
                System.err
                        .println("[Worker] Failed to process submission " + submission.getId() + ": " + e.getMessage());
            }
        }
    }
}
