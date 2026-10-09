package com.codearena.monitoring.service;

import com.codearena.monitoring.dto.Judge0HealthDTO;
import com.codearena.monitoring.dto.SubmissionAnalyticsDTO;
import com.codearena.monitoring.dto.ServiceHealthDTO;
import com.codearena.problems.entity.Submission;
import com.codearena.problems.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Aggregates submission volume, error distributions, time-series metrics,
 * and execution statistics directly from database records.
 */
@Service
@RequiredArgsConstructor
public class SubmissionAnalyticsService {

    private final SubmissionRepository submissionRepository;
    private final HealthCheckService healthCheckService;

    @Value("${judge0.api.url:https://ce.judge0.com}")
    private String judge0Url;

    @Transactional(readOnly = true)
    public SubmissionAnalyticsDTO getAnalytics(String range) {
        String effectiveRange = (range != null && !range.isBlank()) ? range.toLowerCase() : "24h";

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime startTime;
        int bucketCount;
        DateTimeFormatter formatter;

        switch (effectiveRange) {
            case "1h":
                startTime = now.minusHours(1);
                bucketCount = 12; // 5-minute buckets
                formatter = DateTimeFormatter.ofPattern("HH:mm");
                break;
            case "7d":
                startTime = now.minusDays(7);
                bucketCount = 7; // daily buckets
                formatter = DateTimeFormatter.ofPattern("MMM dd");
                break;
            case "30d":
                startTime = now.minusDays(30);
                bucketCount = 15; // 2-day buckets
                formatter = DateTimeFormatter.ofPattern("MMM dd");
                break;
            case "all":
                startTime = now.minusYears(5);
                bucketCount = 12;
                formatter = DateTimeFormatter.ofPattern("MMM yyyy");
                break;
            case "24h":
            default:
                effectiveRange = "24h";
                startTime = now.minusHours(24);
                bucketCount = 24; // hourly buckets
                formatter = DateTimeFormatter.ofPattern("HH:mm");
                break;
        }

        List<Submission> submissions = submissionRepository.findBySubmittedAtAfterOrderBySubmittedAtAsc(startTime);

        long total = submissions.size();
        long accepted = 0;
        long wrongAnswer = 0;
        long timeLimit = 0;
        long memoryLimit = 0;
        long compilation = 0;
        long runtime = 0;
        long platform = 0;

        double totalExecutionTime = 0;
        long executionCount = 0;

        Map<String, Long> languageCounts = new LinkedHashMap<>();

        for (Submission s : submissions) {
            Submission.Status status = s.getStatus();
            if (status != null) {
                switch (status) {
                    case ACCEPTED:
                        accepted++;
                        break;
                    case WRONG_ANSWER:
                        wrongAnswer++;
                        break;
                    case TIME_LIMIT_EXCEEDED:
                        timeLimit++;
                        break;
                    case MEMORY_LIMIT_EXCEEDED:
                        memoryLimit++;
                        break;
                    case COMPILATION_ERROR:
                        compilation++;
                        break;
                    case RUNTIME_ERROR:
                        runtime++;
                        break;
                    default:
                        platform++;
                        break;
                }
            }

            if (s.getExecutionTime() != null && s.getExecutionTime() > 0) {
                totalExecutionTime += s.getExecutionTime();
                executionCount++;
            }

            String lang = s.getLanguage() != null ? s.getLanguage() : "unknown";
            languageCounts.put(lang, languageCounts.getOrDefault(lang, 0L) + 1);
        }

        double acceptanceRate = total > 0 ? (double) accepted / total * 100.0 : 0.0;
        double platformFailureRate = total > 0 ? (double) platform / total * 100.0 : 0.0;
        double avgExecutionTime = executionCount > 0 ? totalExecutionTime / executionCount : 0.0;

        // Generate Time Series Buckets
        List<SubmissionAnalyticsDTO.TimeSeriesPoint> timeSeries = generateTimeSeriesBuckets(
                submissions, startTime, now, bucketCount, formatter
        );

        return SubmissionAnalyticsDTO.builder()
                .timeRange(effectiveRange)
                .startTime(startTime.toInstant(ZoneOffset.UTC))
                .endTime(now.toInstant(ZoneOffset.UTC))
                .totalSubmissions(total)
                .acceptedSubmissions(accepted)
                .wrongAnswerSubmissions(wrongAnswer)
                .timeLimitExceeded(timeLimit)
                .memoryLimitExceeded(memoryLimit)
                .compilationErrors(compilation)
                .runtimeErrors(runtime)
                .platformErrors(platform)
                .acceptanceRatePercent(Math.round(acceptanceRate * 10.0) / 10.0)
                .platformFailureRatePercent(Math.round(platformFailureRate * 10.0) / 10.0)
                .avgExecutionTimeMs(Math.round(avgExecutionTime * 10.0) / 10.0)
                .languageBreakdown(languageCounts)
                .timeSeries(timeSeries)
                .build();
    }

    @Transactional(readOnly = true)
    public Judge0HealthDTO getJudge0Operations() {
        ServiceHealthDTO jHealth = healthCheckService.checkJudge0Health();
        List<Submission> allSubmissions = submissionRepository.findAll();

        long total = allSubmissions.size();
        long accepted = 0;
        long wrongAnswer = 0;
        long compilation = 0;
        long runtime = 0;
        long timeLimit = 0;
        long memoryLimit = 0;
        long platform = 0;

        Map<String, Long> supportedLangs = new HashMap<>();

        for (Submission s : allSubmissions) {
            if (s.getStatus() != null) {
                switch (s.getStatus()) {
                    case ACCEPTED: accepted++; break;
                    case WRONG_ANSWER: wrongAnswer++; break;
                    case COMPILATION_ERROR: compilation++; break;
                    case RUNTIME_ERROR: runtime++; break;
                    case TIME_LIMIT_EXCEEDED: timeLimit++; break;
                    case MEMORY_LIMIT_EXCEEDED: memoryLimit++; break;
                    default: platform++; break;
                }
            }
            if (s.getLanguage() != null) {
                supportedLangs.put(s.getLanguage(), supportedLangs.getOrDefault(s.getLanguage(), 0L) + 1);
            }
        }

        double successRate = total > 0 ? (double) accepted / total * 100.0 : 0.0;
        long pending = submissionRepository.countByStatusIn(List.of(Submission.Status.PENDING, Submission.Status.RUNNING));

        return Judge0HealthDTO.builder()
                .status(jHealth.getStatus())
                .apiUrl(judge0Url)
                .latencyMs(jHealth.getResponseTimeMs())
                .lastChecked(jHealth.getLastCheckTime())
                .totalExecutions(total)
                .acceptedCount(accepted)
                .wrongAnswerCount(wrongAnswer)
                .compilationErrors(compilation)
                .runtimeErrors(runtime)
                .timeLimitExceeded(timeLimit)
                .memoryLimitExceeded(memoryLimit)
                .platformErrors(platform)
                .successRatePercent(Math.round(successRate * 10.0) / 10.0)
                .queueArchitecture("Direct Synchronous Execution (wait=true, CE Sandbox)")
                .pendingSubmissions(pending)
                .supportedLanguages(supportedLangs)
                .build();
    }

    private List<SubmissionAnalyticsDTO.TimeSeriesPoint> generateTimeSeriesBuckets(
            List<Submission> submissions, LocalDateTime start, LocalDateTime end, int bucketCount, DateTimeFormatter formatter) {

        long totalSeconds = java.time.Duration.between(start, end).getSeconds();
        long bucketSizeSeconds = Math.max(1, totalSeconds / bucketCount);

        List<SubmissionAnalyticsDTO.TimeSeriesPoint> points = new ArrayList<>();

        for (int i = 0; i < bucketCount; i++) {
            LocalDateTime bucketStart = start.plusSeconds(i * bucketSizeSeconds);
            LocalDateTime bucketEnd = start.plusSeconds((i + 1) * bucketSizeSeconds);

            List<Submission> inBucket = submissions.stream()
                    .filter(s -> s.getSubmittedAt() != null
                            && !s.getSubmittedAt().isBefore(bucketStart)
                            && s.getSubmittedAt().isBefore(bucketEnd))
                    .collect(Collectors.toList());

            long totalInBucket = inBucket.size();
            long acceptedInBucket = inBucket.stream().filter(s -> s.getStatus() == Submission.Status.ACCEPTED).count();
            long failedInBucket = totalInBucket - acceptedInBucket;

            double avgLatency = inBucket.stream()
                    .filter(s -> s.getExecutionTime() != null && s.getExecutionTime() > 0)
                    .mapToInt(Submission::getExecutionTime)
                    .average()
                    .orElse(0.0);

            points.add(SubmissionAnalyticsDTO.TimeSeriesPoint.builder()
                    .timestamp(bucketEnd.format(formatter))
                    .total(totalInBucket)
                    .accepted(acceptedInBucket)
                    .failed(failedInBucket)
                    .avgLatencyMs(Math.round(avgLatency * 10.0) / 10.0)
                    .build());
        }

        return points;
    }
}
