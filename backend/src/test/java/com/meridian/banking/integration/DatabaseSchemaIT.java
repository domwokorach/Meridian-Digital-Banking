package com.meridian.banking.integration;

import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseSchemaIT extends TransactionalIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired TransferRepository transfers;
    @Autowired TransactionRepository transactions;

    @Test void connectsToTheIsolatedTestDatabase() {
        String db = jdbc.queryForObject("select current_database()", String.class);
        assertTrue(db.endsWith("_test"), "connected to " + db);
        assertNotEquals("meridian", db);
    }
    @Test void flywayAppliedTheMigrationsSuccessfully() {
        Integer failed = jdbc.queryForObject("select count(*) from flyway_schema_history where success = false", Integer.class);
        Integer applied = jdbc.queryForObject("select count(*) from flyway_schema_history where success = true and version is not null", Integer.class);
        assertEquals(0, failed);
        assertTrue(applied >= 1);
    }
    @Test void demoDataIsNotSeeded() {
        assertFalse(users.existsByEmail("demo@meridian.test"));
    }
    @Test void balancesUseExactNumeric19Scale2() {
        var row = jdbc.queryForMap("select numeric_precision p, numeric_scale s from information_schema.columns where table_name='accounts' and column_name='balance'");
        assertEquals(19, ((Number) row.get("p")).intValue());
        assertEquals(2, ((Number) row.get("s")).intValue());
    }
    @Test void aBalanceIsStoredWithoutFloatingPointError() {
        User u = newUser("precision");
        Account a = newAccount(u, "Precision", "CURRENT", "1065.45");
        jdbc.update("update accounts set balance = balance + ? where id = ?", new BigDecimal("5557.24"), a.id);
        assertEquals(0, new BigDecimal("6622.69").compareTo(jdbc.queryForObject("select balance from accounts where id = ?", BigDecimal.class, a.id)));
    }
    @Test void negativeBalancesAreRejectedByTheDatabase() {
        Account a = newAccount(newUser("neg"), "Neg", "CURRENT", "10.00");
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("update accounts set balance = -0.01 where id = ?", a.id));
    }
    @Test void duplicateAccountNumbersAreRejected() {
        User u = newUser("dup");
        Account a = newAccount(u, "A", "CURRENT", "1.00");
        Account clash = new Account(u.id, a.accountNumber, "B", "SAVINGS");
        assertThrows(DataIntegrityViolationException.class, () -> accounts.saveAndFlush(clash));
    }
    @Test void duplicateEmailsAreRejected() {
        User u = newUser("mail");
        assertThrows(DataIntegrityViolationException.class, () -> users.saveAndFlush(new User("Other", u.email, "hash")));
    }
    @Test void aRequestIdCanOnlyBeUsedOncePerUser() {
        User u = newUser("idem");
        Account a = newAccount(u, "A", "CURRENT", "10.00"), b = newAccount(u, "B", "SAVINGS", "0.00");
        UUID requestId = UUID.randomUUID();
        transfers.saveAndFlush(new Transfer(u.id, requestId, a.id, b.id, new BigDecimal("1.00"), "first"));
        assertThrows(DataIntegrityViolationException.class,
            () -> transfers.saveAndFlush(new Transfer(u.id, requestId, a.id, b.id, new BigDecimal("2.00"), "second")));
    }
    @Test void aTransferBetweenTheSameAccountIsRejected() {
        User u = newUser("same");
        Account a = newAccount(u, "A", "CURRENT", "10.00");
        assertThrows(DataIntegrityViolationException.class,
            () -> transfers.saveAndFlush(new Transfer(u.id, UUID.randomUUID(), a.id, a.id, new BigDecimal("1.00"), "loop")));
    }
    @Test void nonPositiveTransferAmountsAreRejected() {
        User u = newUser("amt");
        Account a = newAccount(u, "A", "CURRENT", "10.00"), b = newAccount(u, "B", "SAVINGS", "0.00");
        assertThrows(DataIntegrityViolationException.class,
            () -> transfers.saveAndFlush(new Transfer(u.id, UUID.randomUUID(), a.id, b.id, BigDecimal.ZERO, "zero")));
    }
    @Test void ledgerRowsMustReferenceARealAccount() {
        assertThrows(DataIntegrityViolationException.class, () -> transactions.saveAndFlush(
            new BankTransaction(UUID.randomUUID(), null, "CREDIT", "orphan", new BigDecimal("1.00"), new BigDecimal("1.00"), Instant.now())));
    }
}
