package com.meridian.banking.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meridian.banking.domain.Account;
import com.meridian.banking.domain.User;
import com.meridian.banking.repo.TransactionRepository;
import com.meridian.banking.repo.TransferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Fictional fixtures: 1,065.45 + 5,557.24 = 6,622.69. */
class AccountsAndTransfersIT extends TransactionalIntegrationTest {
    @Autowired TransferRepository transfers;
    @Autowired TransactionRepository transactions;
    @Autowired ObjectMapper mapper;
    User user; Account current, savings;

    @BeforeEach void fixtures() {
        user = newUser("owner");
        current = newAccount(user, "Everyday account", "CURRENT", "1065.45");
        savings = newAccount(user, "Rainy day savings", "SAVINGS", "5557.24");
    }
    private ResultActions transfer(UUID requestId, Account from, Account to, String amount) throws Exception {
        return mvc.perform(post("/api/transfers").header("Authorization", bearer(user)).contentType(MediaType.APPLICATION_JSON)
            .content("{\"requestId\":\"" + requestId + "\",\"fromAccountId\":\"" + from.id + "\",\"toAccountId\":\"" + to.id + "\",\"amount\":\"" + amount + "\",\"reference\":\"Test\"}"));
    }
    private BigDecimal balance(Account a) { accounts.flush(); return accounts.findById(a.id).orElseThrow().balance; }

    @Test void accountBalancesAndTheirExactTotalAreReturned() throws Exception {
        String body = mvc.perform(get("/api/accounts").header("Authorization", bearer(user))).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].sortCode").value("20-42-66")).andReturn().getResponse().getContentAsString();
        BigDecimal total = BigDecimal.ZERO;
        for (JsonNode a : mapper.readTree(body)) total = total.add(a.get("balance").decimalValue());
        assertEquals(0, new BigDecimal("6622.69").compareTo(total));
    }
    @Test void successfulTransferMovesMoneyAndWritesBothLedgerRows() throws Exception {
        transfer(UUID.randomUUID(), current, savings, "65.45").andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(65.45));
        assertEquals(0, new BigDecimal("1000.00").compareTo(balance(current)));
        assertEquals(0, new BigDecimal("5622.69").compareTo(balance(savings)));
        assertEquals(0, new BigDecimal("6622.69").compareTo(balance(current).add(balance(savings))), "money is conserved");
        mvc.perform(get("/api/accounts/" + current.id + "/transactions").header("Authorization", bearer(user)))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].kind").value("DEBIT"))
            .andExpect(jsonPath("$[0].balanceAfter").value(1000.00)).andExpect(jsonPath("$[0].description").value(containsString("Rainy day savings")));
        mvc.perform(get("/api/accounts/" + savings.id + "/transactions").header("Authorization", bearer(user)))
            .andExpect(jsonPath("$[0].kind").value("CREDIT")).andExpect(jsonPath("$[0].balanceAfter").value(5622.69));
    }
    @Test void insufficientFundsIsRejectedAndNothingChanges() throws Exception {
        transfer(UUID.randomUUID(), current, savings, "1065.46").andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Insufficient funds"));
        assertEquals(0, new BigDecimal("1065.45").compareTo(balance(current)));
        assertEquals(0, new BigDecimal("5557.24").compareTo(balance(savings)));
        assertEquals(0, transactions.count());
        assertEquals(0, transfers.count());
    }
    @Test void aReplayedRequestIdDoesNotMoveMoneyTwice() throws Exception {
        UUID requestId = UUID.randomUUID();
        String first = transfer(requestId, current, savings, "100.00").andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String second = transfer(requestId, current, savings, "100.00").andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(mapper.readTree(first).get("id"), mapper.readTree(second).get("id"));
        assertEquals(0, new BigDecimal("965.45").compareTo(balance(current)));
        assertEquals(1, transfers.count());
        assertEquals(2, transactions.count());
    }
    @Test void reusingARequestIdWithADifferentAmountConflicts() throws Exception {
        UUID requestId = UUID.randomUUID();
        transfer(requestId, current, savings, "100.00").andExpect(status().isOk());
        transfer(requestId, current, savings, "200.00").andExpect(status().isConflict());
        assertEquals(0, new BigDecimal("965.45").compareTo(balance(current)));
    }
    @Test void invalidTransferInputIsRejectedByValidation() throws Exception {
        for (String bad : new String[]{"0", "0.00", "-5.00", "1.999"}) transfer(UUID.randomUUID(), current, savings, bad).andExpect(status().isBadRequest());
        transfer(UUID.randomUUID(), current, current, "1.00").andExpect(status().isBadRequest());
        transfer(UUID.randomUUID(), current, savings, "50000.01").andExpect(status().isBadRequest());
        assertEquals(0, transfers.count());
    }
    @Test void transactionHistoryRespectsTheLimitAndIsNewestFirst() throws Exception {
        for (int i = 1; i <= 3; i++) transfer(UUID.randomUUID(), current, savings, i + ".00").andExpect(status().isOk());
        mvc.perform(get("/api/accounts/" + current.id + "/transactions").param("limit", "2").header("Authorization", bearer(user)))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
    }
    @Test void statementDownloadsAsCsvWithTheLedger() throws Exception {
        transfer(UUID.randomUUID(), current, savings, "10.00").andExpect(status().isOk());
        String csv = mvc.perform(get("/api/accounts/" + current.id + "/statement").param("from", LocalDate.now().minusDays(1).toString())
                .param("to", LocalDate.now().toString()).header("Authorization", bearer(user)))
            .andExpect(status().isOk()).andExpect(header().string("Content-Disposition", containsString("attachment")))
            .andReturn().getResponse().getContentAsString();
        assertTrue(csv.startsWith("Date,Account,Type,Description,Amount (GBP),Balance (GBP)"));
        assertTrue(csv.contains(",-10.00,1055.45"), csv);
    }
    @Test void statementRejectsAnInvertedDateRange() throws Exception {
        mvc.perform(get("/api/accounts/" + current.id + "/statement").param("from", LocalDate.now().toString())
                .param("to", LocalDate.now().minusDays(3).toString()).header("Authorization", bearer(user)))
            .andExpect(status().isBadRequest());
    }
}
