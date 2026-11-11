package com.meridian.banking.service;

import com.meridian.banking.api.ApiException;
import com.meridian.banking.api.Dtos.*;
import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class BankingService {
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final TransferRepository transfers;
    private final UserRepository users;
    public BankingService(AccountRepository accounts, TransactionRepository transactions, TransferRepository transfers, UserRepository users) {
        this.accounts = accounts; this.transactions = transactions; this.transfers = transfers; this.users = users;
    }
    @Transactional(readOnly = true)
    public List<AccountView> accounts(UUID userId) { return accounts.findByUserIdOrderByAccountTypeAsc(userId).stream().map(AccountView::of).toList(); }
    @Transactional(readOnly = true)
    public List<TransactionView> history(UUID userId, UUID accountId, int limit) {
        owned(userId, accountId);
        return transactions.findByAccountIdOrderByCreatedAtDesc(accountId, PageRequest.of(0, Math.min(Math.max(limit, 1), 200)))
            .stream().map(TransactionView::of).toList();
    }
    @Transactional
    public TransferView transfer(UUID userId, TransferRequest req) {
        // Serializing transfers per owner means retries with the same requestId are safe.
        users.lockById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        var existing = transfers.findByUserIdAndRequestId(userId, req.requestId());
        if (existing.isPresent()) {
            Transfer prev = existing.get();
            if (!prev.fromAccountId.equals(req.fromAccountId()) || !prev.toAccountId.equals(req.toAccountId()) ||
                prev.amount.compareTo(req.amount()) != 0) throw new ApiException(HttpStatus.CONFLICT, "Request ID has already been used");
            return TransferView.of(prev);
        }
        if (req.fromAccountId().equals(req.toAccountId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Choose two different accounts");
        if (req.amount().compareTo(new BigDecimal("50000.00")) > 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Maximum transfer is £50,000");
        // Consistent lock order prevents deadlocks for concurrent opposite transfers.
        var ids = new ArrayList<>(List.of(req.fromAccountId(), req.toAccountId()));
        ids.sort(Comparator.naturalOrder());
        Map<UUID, Account> locked = new HashMap<>();
        for (UUID id : ids) {
            Account a = accounts.lockById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
            if (!a.userId.equals(userId)) throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");
            locked.put(id, a);
        }
        Account from = locked.get(req.fromAccountId()), to = locked.get(req.toAccountId());
        if (from.balance.compareTo(req.amount()) < 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient funds");
        BigDecimal amount = req.amount().setScale(2);
        from.balance = from.balance.subtract(amount);
        to.balance = to.balance.add(amount);
        String ref = req.reference() == null || req.reference().isBlank() ? "Between my accounts" : req.reference().trim();
        Transfer t = transfers.save(new Transfer(userId, req.requestId(), from.id, to.id, amount, ref));
        Instant now = Instant.now();
        transactions.save(new BankTransaction(from.id, t.id, "DEBIT", "Transfer to " + to.name + " · " + ref, amount, from.balance, now));
        transactions.save(new BankTransaction(to.id, t.id, "CREDIT", "Transfer from " + from.name + " · " + ref, amount, to.balance, now));
        accounts.saveAll(List.of(from, to));
        return TransferView.of(t);
    }
    @Transactional(readOnly = true)
    public String statementCsv(UUID userId, UUID accountId, LocalDate from, LocalDate to) {
        Account account = owned(userId, accountId);
        if (from.isAfter(to) || from.isBefore(LocalDate.now().minusYears(5)) || to.isAfter(LocalDate.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a valid statement date range within the last five years");
        Instant start = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        var rows = transactions.findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(account.id, start, end);
        StringBuilder csv = new StringBuilder("Date,Account,Type,Description,Amount (GBP),Balance (GBP)\r\n");
        for (BankTransaction t : rows) {
            csv.append(safe(t.createdAt.toString())).append(',').append(safe(account.name)).append(',')
                .append(safe(t.kind)).append(',').append(safe(t.description)).append(',')
                .append(t.kind.equals("DEBIT") ? "-" : "").append(t.amount.toPlainString()).append(',')
                .append(t.balanceAfter.toPlainString()).append("\r\n");
        }
        return csv.toString();
    }
    private Account owned(UUID userId, UUID accountId) {
        return accounts.findByIdAndUserId(accountId, userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
    }
    // Protect spreadsheet users against formula injection and escape CSV quoting.
    private String safe(String value) {
        String s = value.replace("\r", " ").replace("\n", " ");
        if (!s.isEmpty() && "=+-@\t".indexOf(s.charAt(0)) >= 0) s = "'" + s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
