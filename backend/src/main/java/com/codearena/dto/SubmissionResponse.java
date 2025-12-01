package com.codearena.dto;

import com.codearena.entity.Submission;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SubmissionResponse {
    private Long id;
    private Long userId;
    private String username;
    private Long problemId;
    private String problemTitle;
    private String language;
    private Submission.Status status;
    private String errorMessage;
    private Integer executionTime;
    private Integer memoryUsed;
    private Integer testCasesPassed;
    private Integer totalTestCases;
    private LocalDateTime submittedAt;
}
