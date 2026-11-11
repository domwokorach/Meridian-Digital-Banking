package com.meridian.banking.repo;

import com.meridian.banking.domain.BankTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<BankTransaction, UUID> {
    List<BankTransaction> findByAccountIdOrderByCreatedAtDesc(UUID accountId, Pageable pageable);
    List<BankTransaction> findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(UUID accountId, Instant from, Instant to);
}
