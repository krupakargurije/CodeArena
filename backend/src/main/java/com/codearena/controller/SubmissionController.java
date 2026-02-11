package com.codearena.controller;

import com.codearena.dto.SubmissionRequest;
import com.codearena.dto.SubmissionResponse;
import com.codearena.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println(">>> SubmissionController Initialized! Mapped to /api/submissions <<<");
    }

    @PostMapping
    public ResponseEntity<SubmissionResponse> submitCode(
            @Valid @RequestBody SubmissionRequest request,
            Authentication authentication) {
        System.out.println("Submission Endpoint HIT!");
        System.out.println("Request: ProblemID=" + request.getProblemId() + ", Language=" + request.getLanguage());
        String username = authentication.getName();
        return ResponseEntity.ok(submissionService.submitCode(request, username));
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        System.out.println("Submission Controller Ping!");
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SubmissionResponse>> getUserSubmissions(@PathVariable String userId) {
        return ResponseEntity.ok(submissionService.getUserSubmissions(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmission(id));
    }
}
