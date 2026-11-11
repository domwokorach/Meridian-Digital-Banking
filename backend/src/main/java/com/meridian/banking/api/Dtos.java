package com.meridian.banking.api;

import com.meridian.banking.domain.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class Dtos {
    private Dtos() {}
    public record RegisterRequest(@NotBlank @Size(min = 2, max = 120) String fullName,
                                  @NotBlank @Email String email,
                                  @NotBlank @Size(min = 10, max = 128) String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record UserView(UUID id, String fullName, String email) {
        public static UserView of(User u) { return new UserView(u.id, u.fullName, u.email); }
    }
    public record AuthResponse(String token, UserView user) {}
    public record AccountView(UUID id, String name, String accountType, String accountNumber, String sortCode, BigDecimal balance) {
        public static AccountView of(Account a) { return new AccountView(a.id, a.name, a.accountType, a.accountNumber, a.sortCode, a.balance); }
    }
    public record TransactionView(UUID id, UUID accountId, String kind, String description, BigDecimal amount, BigDecimal balanceAfter, Instant createdAt) {
        public static TransactionView of(BankTransaction t) { return new TransactionView(t.id, t.accountId, t.kind, t.description, t.amount, t.balanceAfter, t.createdAt); }
    }
    public record TransferRequest(@NotNull UUID requestId, @NotNull UUID fromAccountId,
                                  @NotNull UUID toAccountId, @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
                                  @Size(max = 120) String reference) {}
    public record TransferView(UUID id, UUID fromAccountId, UUID toAccountId, BigDecimal amount, String reference, Instant createdAt) {
        public static TransferView of(Transfer t) { return new TransferView(t.id, t.fromAccountId, t.toAccountId, t.amount, t.reference, t.createdAt); }
    }
}
