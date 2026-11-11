package com.meridian.banking.service;

import com.meridian.banking.api.ApiException;
import com.meridian.banking.api.Dtos.AccountView;
import com.meridian.banking.api.Dtos.TransferRequest;
import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Business-rule tests for BankingService using fictional fixtures. */
@ExtendWith(MockitoExtension.class)
class BankingServiceRulesTest {
    @Mock AccountRepository accounts;
    @Mock TransactionRepository transactions;
    @Mock TransferRepository transfers;
    @Mock UserRepository users;
    @InjectMocks BankingService service;
    final UUID owner = UUID.randomUUID();
    final UUID stranger = UUID.randomUUID();
    Account current, savings, foreign;

    @BeforeEach void setUp() {
        current = account(owner, "11111111", "Everyday account", "CURRENT", "1065.45");
        savings = account(owner, "22222222", "Rainy day savings", "SAVINGS", "5557.24");
        foreign = account(stranger, "33333333", "Someone else", "CURRENT", "900.00");
    }
    private static Account account(UUID user, String number, String name, String type, String balance) {
        Account a = new Account(user, number, name, type);
        a.balance = new BigDecimal(balance);
        return a;
    }
    private void userExists() { when(users.lockById(owner)).thenReturn(Optional.of(new User("A", "a@example.com", "hash"))); }
    private TransferRequest request(UUID from, UUID to, String amount) {
        return new TransferRequest(UUID.randomUUID(), from, to, new BigDecimal(amount), "ref");
    }
    private ApiException failure(UUID from, UUID to, String amount) {
        return assertThrows(ApiException.class, () -> service.transfer(owner, request(from, to, amount)));
    }

    @Test void accountsAreReadForTheAuthenticatedUserOnly() {
        when(accounts.findByUserIdOrderByAccountTypeAsc(owner)).thenReturn(List.of(current, savings));
        List<AccountView> views = service.accounts(owner);
        assertEquals(2, views.size());
        verify(accounts).findByUserIdOrderByAccountTypeAsc(owner);
        verifyNoMoreInteractions(accounts);
    }
    @Test void totalBalanceIsTheExactBigDecimalSumOfAccountBalances() {
        when(accounts.findByUserIdOrderByAccountTypeAsc(owner)).thenReturn(List.of(current, savings));
        BigDecimal total = service.accounts(owner).stream().map(AccountView::balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("6622.69").compareTo(total));
    }
    @Test void bigDecimalAvoidsFloatingPointDrift() {
        assertNotEquals(0.3, 0.1 + 0.2);
        assertEquals(0, new BigDecimal("0.30").compareTo(new BigDecimal("0.10").add(new BigDecimal("0.20"))));
    }
    @Test void historyRequiresOwnershipAndClampsTheLimit() {
        when(accounts.findByIdAndUserId(current.id, owner)).thenReturn(Optional.of(current));
        when(transactions.findByAccountIdOrderByCreatedAtDesc(any(), any(Pageable.class))).thenReturn(List.of());
        service.history(owner, current.id, 9999);
        var page = ArgumentCaptor.forClass(Pageable.class);
        verify(transactions).findByAccountIdOrderByCreatedAtDesc(any(), page.capture());
        assertEquals(200, page.getValue().getPageSize());
        service.history(owner, current.id, -5);
        verify(transactions, times(2)).findByAccountIdOrderByCreatedAtDesc(any(), page.capture());
        assertEquals(1, page.getValue().getPageSize());
    }
    @Test void historyOfSomeoneElsesAccountIsNotFound() {
        when(accounts.findByIdAndUserId(foreign.id, owner)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> service.history(owner, foreign.id, 10));
        assertEquals(HttpStatus.NOT_FOUND, ex.status);
        verifyNoInteractions(transactions);
    }
    @Test void transferToAnotherUsersAccountIsRejectedAndNothingMoves() {
        userExists();
        // Locks are taken in UUID order, so either stub may be the one that throws first.
        lenient().when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        lenient().when(accounts.lockById(foreign.id)).thenReturn(Optional.of(foreign));
        ApiException ex = failure(current.id, foreign.id, "10.00");
        assertEquals(HttpStatus.NOT_FOUND, ex.status);
        assertEquals(0, new BigDecimal("900.00").compareTo(foreign.balance));
        assertEquals(0, new BigDecimal("1065.45").compareTo(current.balance));
        verifyNoInteractions(transactions);
    }
    @Test void transferFromUnknownAccountIsNotFound() {
        userExists();
        UUID missing = UUID.randomUUID();
        when(accounts.lockById(any())).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND, failure(missing, savings.id, "1.00").status);
    }
    @Test void unknownUserIsUnauthorised() {
        when(users.lockById(owner)).thenReturn(Optional.empty());
        ApiException ex = failure(current.id, savings.id, "1.00");
        assertEquals(HttpStatus.UNAUTHORIZED, ex.status);
    }
    @Test void transferBetweenTheSameAccountIsRejected() {
        userExists();
        assertEquals(HttpStatus.BAD_REQUEST, failure(current.id, current.id, "1.00").status);
    }
    @Test void transferAboveTheLimitIsRejected() {
        userExists();
        ApiException ex = failure(current.id, savings.id, "50000.01");
        assertEquals(HttpStatus.BAD_REQUEST, ex.status);
        assertTrue(ex.getMessage().contains("50,000"));
    }
    @Test void transferOfTheWholeBalanceLeavesExactlyZeroNotNegative() {
        userExists();
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        when(transfers.save(any(Transfer.class))).thenAnswer(i -> i.getArgument(0));
        service.transfer(owner, request(current.id, savings.id, "1065.45"));
        assertEquals(0, BigDecimal.ZERO.compareTo(current.balance));
        assertEquals(0, new BigDecimal("6622.69").compareTo(current.balance.add(savings.balance)), "money is conserved");
    }
    @Test void oneCentOverTheBalanceIsInsufficientFunds() {
        userExists();
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        ApiException ex = failure(current.id, savings.id, "1065.46");
        assertEquals(HttpStatus.BAD_REQUEST, ex.status);
        assertEquals("Insufficient funds", ex.getMessage());
    }
    @Test void transferWritesDebitAndCreditLedgerRowsWithRunningBalances() {
        userExists();
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        when(transfers.save(any(Transfer.class))).thenAnswer(i -> i.getArgument(0));
        service.transfer(owner, request(current.id, savings.id, "65.45"));
        var rows = ArgumentCaptor.forClass(BankTransaction.class);
        verify(transactions, times(2)).save(rows.capture());
        BankTransaction debit = rows.getAllValues().get(0), credit = rows.getAllValues().get(1);
        assertEquals("DEBIT", debit.kind);
        assertEquals(0, new BigDecimal("1000.00").compareTo(debit.balanceAfter));
        assertEquals("CREDIT", credit.kind);
        assertEquals(0, new BigDecimal("5622.69").compareTo(credit.balanceAfter));
        assertNotNull(debit.transferId);
        assertEquals(debit.transferId, credit.transferId);
    }
    @Test void blankReferenceFallsBackToADefault() {
        userExists();
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        when(transfers.save(any(Transfer.class))).thenAnswer(i -> i.getArgument(0));
        var result = service.transfer(owner, new TransferRequest(UUID.randomUUID(), current.id, savings.id, new BigDecimal("1.00"), "  "));
        assertEquals("Between my accounts", result.reference());
    }
    @Test void replayedRequestIdReturnsTheOriginalTransferWithoutMovingMoney() {
        userExists();
        UUID requestId = UUID.randomUUID();
        Transfer previous = new Transfer(owner, requestId, current.id, savings.id, new BigDecimal("10.00"), "ref");
        when(transfers.findByUserIdAndRequestId(owner, requestId)).thenReturn(Optional.of(previous));
        var replay = new TransferRequest(requestId, current.id, savings.id, new BigDecimal("10.0"), "ref");
        var result = service.transfer(owner, replay);
        assertEquals(previous.id, result.id());
        assertEquals(0, new BigDecimal("1065.45").compareTo(current.balance));
        verifyNoInteractions(accounts, transactions);
        verify(transfers, never()).save(any());
    }
    @Test void reusingARequestIdWithDifferentDetailsConflicts() {
        userExists();
        UUID requestId = UUID.randomUUID();
        Transfer previous = new Transfer(owner, requestId, current.id, savings.id, new BigDecimal("10.00"), "ref");
        when(transfers.findByUserIdAndRequestId(owner, requestId)).thenReturn(Optional.of(previous));
        var different = new TransferRequest(requestId, current.id, savings.id, new BigDecimal("11.00"), "ref");
        ApiException ex = assertThrows(ApiException.class, () -> service.transfer(owner, different));
        assertEquals(HttpStatus.CONFLICT, ex.status);
    }

    // ---- statements ----
    private void ownsCurrent() { when(accounts.findByIdAndUserId(current.id, owner)).thenReturn(Optional.of(current)); }
    private BankTransaction row(String kind, String description, String amount, String after) {
        return new BankTransaction(current.id, null, kind, description, new BigDecimal(amount), new BigDecimal(after), Instant.parse("2026-01-05T10:00:00Z"));
    }
    @Test void statementHasHeaderSignedAmountsAndBalances() {
        ownsCurrent();
        when(transactions.findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(any(), any(), any()))
            .thenReturn(List.of(row("DEBIT", "Coffee", "9.80", "1055.65"), row("CREDIT", "Salary", "1149.00", "1065.45")));
        String csv = service.statementCsv(owner, current.id, LocalDate.now().minusDays(30), LocalDate.now());
        String[] lines = csv.split("\r\n");
        assertEquals("Date,Account,Type,Description,Amount (GBP),Balance (GBP)", lines[0]);
        assertTrue(lines[1].contains("\"DEBIT\"") && lines[1].contains(",-9.80,1055.65"));
        assertTrue(lines[2].contains(",1149.00,1065.45"));
    }
    @Test void statementNeutralisesSpreadsheetFormulasAndEscapesQuotes() {
        ownsCurrent();
        when(transactions.findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(any(), any(), any()))
            .thenReturn(List.of(row("CREDIT", "=HYPERLINK(\"x\")", "1.00", "1.00")));
        String csv = service.statementCsv(owner, current.id, LocalDate.now().minusDays(1), LocalDate.now());
        assertTrue(csv.contains("\"'=HYPERLINK(\"\"x\"\")\""), csv);
    }
    @Test void statementRejectsInvalidDateRanges() {
        ownsCurrent();
        LocalDate today = LocalDate.now();
        for (LocalDate[] range : new LocalDate[][]{{today, today.minusDays(1)}, {today.minusYears(6), today}, {today, today.plusDays(1)}}) {
            ApiException ex = assertThrows(ApiException.class, () -> service.statementCsv(owner, current.id, range[0], range[1]));
            assertEquals(HttpStatus.BAD_REQUEST, ex.status);
        }
    }
    @Test void statementOfSomeoneElsesAccountIsNotFound() {
        when(accounts.findByIdAndUserId(foreign.id, owner)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> service.statementCsv(owner, foreign.id, LocalDate.now().minusDays(1), LocalDate.now()));
        assertEquals(HttpStatus.NOT_FOUND, ex.status);
    }
}
