package com.meridian.banking.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "transactions")
public class BankTransaction {
    @Id public UUID id = UUID.randomUUID();
    @Column(name = "account_id", nullable = false) public UUID accountId;
    @Column(name = "transfer_id") public UUID transferId;
    @Column(nullable = false) public String kind;
    @Column(nullable = false) public String description;
    @Column(nullable = false, precision = 19, scale = 2) public BigDecimal amount;
    @Column(name = "balance_after", nullable = false, precision = 19, scale = 2) public BigDecimal balanceAfter;
    @Column(name = "created_at", nullable = false) public Instant createdAt = Instant.now();
    protected BankTransaction() {}
    public BankTransaction(UUID accountId, UUID transferId, String kind, String description, BigDecimal amount, BigDecimal balanceAfter, Instant at) {
        this.accountId = accountId; this.transferId = transferId; this.kind = kind;
        this.description = description; this.amount = amount; this.balanceAfter = balanceAfter; this.createdAt = at;
    }
}
