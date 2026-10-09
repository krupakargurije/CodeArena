package com.codearena.problems.service;

import com.codearena.audit.service.AuditLogService;
import com.codearena.problems.entity.Problem;
import com.codearena.problems.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Problem getProblem(Long id) {
        return problemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
    }

    @Transactional(readOnly = true)
    public List<Problem> getProblemsByDifficulty(Problem.Difficulty difficulty) {
        return problemRepository.findByDifficulty(difficulty);
    }

    @Transactional
    public Problem createProblem(Problem problem) {
        Problem saved = problemRepository.save(problem);

        Map<String, Object> after = auditLogService.snapshotProblem(saved);
        auditLogService.recordEvent(
                "CREATE_PROBLEM",
                "PROBLEM",
                String.valueOf(saved.getId()),
                null,
                after,
                "Created problem: " + saved.getTitle()
        );

        return saved;
    }

    @Transactional
    public Problem updateProblem(Long id, Problem problemDetails) {
        Problem problem = getProblem(id);
        Map<String, Object> before = auditLogService.snapshotProblem(problem);

        problem.setTitle(problemDetails.getTitle());
        problem.setDescription(problemDetails.getDescription());
        problem.setDifficulty(problemDetails.getDifficulty());
        problem.setTags(problemDetails.getTags());
        problem.setInputFormat(problemDetails.getInputFormat());
        problem.setOutputFormat(problemDetails.getOutputFormat());
        problem.setConstraints(problemDetails.getConstraints());
        problem.setSampleInput(problemDetails.getSampleInput());
        problem.setSampleOutput(problemDetails.getSampleOutput());
        problem.setExplanation(problemDetails.getExplanation());
        problem.setTestCasesUrl(problemDetails.getTestCasesUrl());

        Problem updated = problemRepository.save(problem);
        Map<String, Object> after = auditLogService.snapshotProblem(updated);

        auditLogService.recordEvent(
                "UPDATE_PROBLEM",
                "PROBLEM",
                String.valueOf(id),
                before,
                after,
                "Updated problem: " + updated.getTitle()
        );

        return updated;
    }

    @Transactional
    public void deleteProblem(Long id) {
        Problem problem = getProblem(id);
        Map<String, Object> before = auditLogService.snapshotProblem(problem);

        problemRepository.deleteById(id);

        auditLogService.recordEvent(
                "DELETE_PROBLEM",
                "PROBLEM",
                String.valueOf(id),
                before,
                null,
                "Deleted problem: " + problem.getTitle()
        );
    }
}
