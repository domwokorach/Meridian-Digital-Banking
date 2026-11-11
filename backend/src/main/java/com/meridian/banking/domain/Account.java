package com.meridian.banking.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "accounts")
public class Account {
    @Id public UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false) public UUID userId;
    @Column(name = "account_number", nullable = false, unique = true) public String accountNumber;
    @Column(name = "sort_code", nullable = false) public String sortCode = "20-42-66";
    @Column(nullable = false) public String name;
    @Column(name = "account_type", nullable = false) public String accountType;
    @Column(nullable = false, precision = 19, scale = 2) public BigDecimal balance = BigDecimal.ZERO.setScale(2);
    @Version public long version;
    @Column(name = "created_at", nullable = false) public Instant createdAt = Instant.now();
    protected Account() {}
    public Account(UUID userId, String number, String name, String type) {
        this.userId = userId; this.accountNumber = number; this.name = name; this.accountType = type;
    }
}
