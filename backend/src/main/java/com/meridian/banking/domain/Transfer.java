package com.meridian.banking.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "transfers", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "request_id"}))
public class Transfer {
    @Id public UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false) public UUID userId;
    @Column(name = "request_id", nullable = false) public UUID requestId;
    @Column(name = "from_account_id", nullable = false) public UUID fromAccountId;
    @Column(name = "to_account_id", nullable = false) public UUID toAccountId;
    @Column(nullable = false, precision = 19, scale = 2) public BigDecimal amount;
    @Column(nullable = false) public String reference;
    @Column(name = "created_at", nullable = false) public Instant createdAt = Instant.now();
    protected Transfer() {}
    public Transfer(UUID userId, UUID requestId, UUID fromAccountId, UUID toAccountId, BigDecimal amount, String reference) {
        this.userId = userId; this.requestId = requestId; this.fromAccountId = fromAccountId;
        this.toAccountId = toAccountId; this.amount = amount; this.reference = reference;
    }
}
