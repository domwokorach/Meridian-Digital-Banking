package com.meridian.banking.integration;

import com.meridian.banking.api.Dtos.TransferRequest;
import com.meridian.banking.domain.Account;
import com.meridian.banking.domain.BankTransaction;
import com.meridian.banking.domain.User;
import com.meridian.banking.repo.TransactionRepository;
import com.meridian.banking.repo.TransferRepository;
import com.meridian.banking.service.BankingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * Real commits, so rollback and concurrency can be observed. NOT wrapped in a test transaction.
 * Cleanup deletes only the rows this class created (tracked by id), in foreign-key order.
 */
class TransferAtomicityIT extends IntegrationTestBase {
    @Autowired BankingService service;
    @Autowired TransferRepository transfers;
    @MockitoSpyBean TransactionRepository transactions;
    @Autowired JdbcTemplate jdbc;
    final List<UUID> userIds = new ArrayList<>(), accountIds = new ArrayList<>();

    private User user() { User u = newUser("atomic"); userIds.add(u.id); return u; }
    private Account account(User u, String type, String balance) { Account a = newAccount(u, type, type, balance); accountIds.add(a.id); return a; }
    private BigDecimal balance(Account a) { return jdbc.queryForObject("select balance from accounts where id = ?", BigDecimal.class, a.id); }
    private int count(String table, String column, List<UUID> ids) {
        if (ids.isEmpty()) return 0;
        return jdbc.queryForObject("select count(*) from " + table + " where " + column + " in (" + String.join(",", Collections.nCopies(ids.size(), "?")) + ")", Integer.class, ids.toArray());
    }
    @AfterEach void cleanUpOnlyWhatThisTestCreated() {
        reset(transactions);
        for (UUID id : accountIds) jdbc.update("delete from transactions where account_id = ?", id);
        for (UUID id : userIds) jdbc.update("delete from transfers where user_id = ?", id);
        for (UUID id : accountIds) jdbc.update("delete from accounts where id = ?", id);
        for (UUID id : userIds) jdbc.update("delete from users where id = ?", id);
    }

    @Test void aFailureWhilstWritingTheLedgerRollsTheWholeTransferBack() {
        User u = user(); Account from = account(u, "CURRENT", "100.00"), to = account(u, "SAVINGS", "50.00");
        // The DEBIT row is written for real first; the CREDIT write then fails, so rollback must undo the debit too.
        doThrow(new IllegalStateException("simulated ledger failure")).when(transactions).save(argThat((BankTransaction t) -> "CREDIT".equals(t.kind)));
        assertThrows(IllegalStateException.class, () -> service.transfer(u.id, new TransferRequest(UUID.randomUUID(), from.id, to.id, new BigDecimal("30.00"), "boom")));
        assertEquals(0, new BigDecimal("100.00").compareTo(balance(from)));
        assertEquals(0, new BigDecimal("50.00").compareTo(balance(to)));
        assertEquals(0, count("transfers", "user_id", List.of(u.id)), "no transfer row survives");
        assertEquals(0, count("transactions", "account_id", List.of(from.id, to.id)), "no ledger row survives");
    }
    @Test void concurrentDuplicateRequestsMoveMoneyExactlyOnce() throws Exception {
        User u = user(); Account from = account(u, "CURRENT", "100.00"), to = account(u, "SAVINGS", "0.00");
        TransferRequest request = new TransferRequest(UUID.randomUUID(), from.id, to.id, new BigDecimal("40.00"), "race");
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            List<Future<UUID>> results = new ArrayList<>();
            CountDownLatch go = new CountDownLatch(1);
            for (int i = 0; i < 4; i++) results.add(pool.submit(() -> { go.await(); return service.transfer(u.id, request).id(); }));
            go.countDown();
            Set<UUID> ids = new HashSet<>();
            for (var f : results) ids.add(f.get(30, TimeUnit.SECONDS));
            assertEquals(1, ids.size(), "every caller receives the same transfer");
        } finally { pool.shutdownNow(); }
        assertEquals(0, new BigDecimal("60.00").compareTo(balance(from)));
        assertEquals(0, new BigDecimal("40.00").compareTo(balance(to)));
        assertEquals(1, count("transfers", "user_id", List.of(u.id)));
    }
    @Test void concurrentTransfersCanNeverOverdrawAnAccount() throws Exception {
        User u = user(); Account from = account(u, "CURRENT", "100.00"), to = account(u, "SAVINGS", "0.00");
        ExecutorService pool = Executors.newFixedThreadPool(5);
        int succeeded = 0;
        try {
            List<Future<Boolean>> results = new ArrayList<>();
            CountDownLatch go = new CountDownLatch(1);
            for (int i = 0; i < 5; i++) results.add(pool.submit(() -> {
                go.await();
                try { service.transfer(u.id, new TransferRequest(UUID.randomUUID(), from.id, to.id, new BigDecimal("30.00"), "drain")); return true; }
                catch (com.meridian.banking.api.ApiException e) { return false; }
            }));
            go.countDown();
            for (var f : results) if (f.get(30, TimeUnit.SECONDS)) succeeded++;
        } finally { pool.shutdownNow(); }
        assertEquals(3, succeeded, "100.00 funds exactly three 30.00 transfers");
        assertEquals(0, new BigDecimal("10.00").compareTo(balance(from)));
        assertEquals(0, new BigDecimal("90.00").compareTo(balance(to)));
    }
}
