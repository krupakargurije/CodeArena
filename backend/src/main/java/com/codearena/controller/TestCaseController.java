package com.codearena.controller;

import com.codearena.entity.Problem;
import com.codearena.entity.TestCase;
import com.codearena.repository.ProblemRepository;
import com.codearena.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems/{problemId}/testcases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseRepository testCaseRepository;
    private final ProblemRepository problemRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TestCase>> getTestCases(@PathVariable Long problemId) {
        return ResponseEntity.ok(testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId));
    }

    @GetMapping("/sample")
    public ResponseEntity<List<TestCase>> getSampleTestCases(@PathVariable Long problemId) {
        return ResponseEntity.ok(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problemId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TestCase> createTestCase(@PathVariable Long problemId, @RequestBody TestCase testCase) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));

        testCase.setProblem(problem);

        // Auto-increment order_index if not supplied
        if (testCase.getOrderIndex() == null || testCase.getOrderIndex() == 0) {
            int count = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId).size();
            testCase.setOrderIndex(count + 1);
        }

        return ResponseEntity.ok(testCaseRepository.save(testCase));
    }

    @DeleteMapping("/{testCaseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTestCase(@PathVariable Long problemId, @PathVariable Long testCaseId) {
        testCaseRepository.deleteById(testCaseId);
        return ResponseEntity.ok().build();
    }
}
