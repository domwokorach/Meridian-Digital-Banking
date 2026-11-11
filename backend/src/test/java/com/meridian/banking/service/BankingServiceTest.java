package com.meridian.banking.service;

import com.meridian.banking.api.ApiException;
import com.meridian.banking.api.Dtos.TransferRequest;
import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BankingServiceTest {
    @Mock AccountRepository accounts;
    @Mock TransactionRepository transactions;
    @Mock TransferRepository transfers;
    @Mock UserRepository users;
    @InjectMocks BankingService service;
    final UUID owner = UUID.randomUUID();
    Account current, savings;
    @BeforeEach void setUp() {
        current = new Account(owner, "12345678", "Everyday account", "CURRENT");
        savings = new Account(owner, "87654321", "Savings", "SAVINGS");
        current.balance = new BigDecimal("100.00");
        savings.balance = new BigDecimal("20.00");
    }
    @Test void transferUpdatesBothBalancesAndWritesTwoLedgerEntries() {
        when(users.lockById(owner)).thenReturn(Optional.of(new User("A", "a@example.com", "hash")));
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        when(transfers.save(any(Transfer.class))).thenAnswer(i -> i.getArgument(0));
        var request = new TransferRequest(UUID.randomUUID(), current.id, savings.id, new BigDecimal("35.50"), "Moving money");
        var result = service.transfer(owner, request);
        assertEquals(0, new BigDecimal("35.50").compareTo(result.amount()));
        assertEquals(0, new BigDecimal("64.50").compareTo(current.balance));
        assertEquals(0, new BigDecimal("55.50").compareTo(savings.balance));
        verify(transactions, times(2)).save(any(BankTransaction.class));
    }
    @Test void insufficientFundsLeaveBalancesUnchanged() {
        when(users.lockById(owner)).thenReturn(Optional.of(new User("A", "a@example.com", "hash")));
        when(accounts.lockById(current.id)).thenReturn(Optional.of(current));
        when(accounts.lockById(savings.id)).thenReturn(Optional.of(savings));
        var request = new TransferRequest(UUID.randomUUID(), current.id, savings.id, new BigDecimal("120.00"), "test");
        assertThrows(ApiException.class, () -> service.transfer(owner, request));
        assertEquals(0, new BigDecimal("100.00").compareTo(current.balance));
        verifyNoInteractions(transactions);
    }
}
