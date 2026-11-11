package com.meridian.banking.repo;

import com.meridian.banking.domain.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {
    Optional<Transfer> findByUserIdAndRequestId(UUID userId, UUID requestId);
}
