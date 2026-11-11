package com.meridian.banking.api;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class ApiErrorHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String,String>> apiError(ApiException ex) {
        return ResponseEntity.status(ex.status).body(Map.of("error", ex.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> invalid(MethodArgumentNotValidException ex) {
        var error = ex.getBindingResult().getFieldErrors().stream().findFirst()
            .map(e -> e.getField() + ": " + e.getDefaultMessage()).orElse("Invalid request");
        return ResponseEntity.badRequest().body(Map.of("error", error));
    }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String,String>> malformed() {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
    }
}
