package com.codearena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class CodeArenaApplication {

    public static void main(String[] args) {
        // Force the application to use UTC to match Render's production environment
        // This prevents the +5.5 hour offset bug caused by local Indian Standard Time
        // (IST)
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(CodeArenaApplication.class, args);
    }
}
