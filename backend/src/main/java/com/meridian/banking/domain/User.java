package com.meridian.banking.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "users")
public class User {
    @Id public UUID id = UUID.randomUUID();
    @Column(name = "full_name", nullable = false) public String fullName;
    @Column(nullable = false, unique = true) public String email;
    @Column(name = "password_hash", nullable = false) public String passwordHash;
    @Column(name = "created_at", nullable = false) public Instant createdAt = Instant.now();
    protected User() {}
    public User(String name, String email, String passwordHash) {
        this.fullName = name; this.email = email; this.passwordHash = passwordHash;
    }
}
