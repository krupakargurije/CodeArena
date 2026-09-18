package com.codearena.home.controller;

import com.codearena.home.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final HomeService homeService;

    @GetMapping
    public ResponseEntity<Map<String, Long>> getGlobalStats() {
        return ResponseEntity.ok(homeService.getGlobalStats());
    }
}
