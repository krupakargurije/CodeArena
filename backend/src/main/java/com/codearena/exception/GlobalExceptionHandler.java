package com.codearena.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        System.out.println(">>> GlobalExceptionHandler caught: " + message);
        ex.printStackTrace(); // Print stack trace for debugging

        // Determine appropriate status based on the exception message
        HttpStatus status;
        if (message != null && (message.contains("not found") || message.contains("Not found"))) {
            status = HttpStatus.NOT_FOUND;
        } else if (message != null && (message.contains("Only room creator") || message.contains("Cannot")
                || message.contains("not available"))) {
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status)
                .body(Map.of("error", message != null ? message : "An unexpected error occurred"));
    }
}