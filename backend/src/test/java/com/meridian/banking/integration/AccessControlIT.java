package com.meridian.banking.integration;

import com.meridian.banking.domain.Account;
import com.meridian.banking.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Customers must never be able to see or move another customer's money. */
class AccessControlIT extends TransactionalIntegrationTest {
    User alex, blake;
    Account alexCurrent, alexSavings, blakeCurrent;

    @org.junit.jupiter.api.BeforeEach void fixtures() {
        alex = newUser("alex"); blake = newUser("blake");
        alexCurrent = newAccount(alex, "Everyday account", "CURRENT", "1065.45");
        alexSavings = newAccount(alex, "Rainy day savings", "SAVINGS", "5557.24");
        blakeCurrent = newAccount(blake, "Blake everyday", "CURRENT", "900.00");
    }

    @Test void requestsWithoutATokenAreRejected() throws Exception {
        for (String path : new String[]{"/api/accounts", "/api/me", "/api/accounts/" + alexCurrent.id + "/transactions"})
            mvc.perform(get(path)).andExpect(result -> assertTrue(result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403, path));
        mvc.perform(post("/api/transfers").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(result -> assertTrue(result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403));
    }
    @Test void aForgedOrGarbageTokenIsRejected() throws Exception {
        mvc.perform(get("/api/accounts").header("Authorization", "Bearer not.a.token"))
            .andExpect(result -> assertTrue(result.getResponse().getStatus() >= 401 && result.getResponse().getStatus() <= 403));
    }
    @Test void aTokenForAUserThatNoLongerExistsIsRejected() throws Exception {
        String ghost = "Bearer " + jwt.create(UUID.randomUUID());
        mvc.perform(get("/api/accounts").header("Authorization", ghost))
            .andExpect(result -> assertTrue(result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403));
    }
    @Test void accountListContainsOnlyTheAuthenticatedUsersAccounts() throws Exception {
        mvc.perform(get("/api/accounts").header("Authorization", bearer(alex)))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].id", containsInAnyOrder(alexCurrent.id.toString(), alexSavings.id.toString())))
            .andExpect(jsonPath("$[*].id", not(hasItem(blakeCurrent.id.toString()))));
        mvc.perform(get("/api/accounts").header("Authorization", bearer(blake)))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(blakeCurrent.id.toString()));
    }
    @Test void anotherCustomersTransactionsAreNotFound() throws Exception {
        mvc.perform(get("/api/accounts/" + blakeCurrent.id + "/transactions").header("Authorization", bearer(alex)))
            .andExpect(status().isNotFound());
    }
    @Test void anotherCustomersStatementIsNotFound() throws Exception {
        mvc.perform(get("/api/accounts/" + blakeCurrent.id + "/statement").param("from", LocalDate.now().minusDays(5).toString())
                .param("to", LocalDate.now().toString()).header("Authorization", bearer(alex)))
            .andExpect(status().isNotFound());
    }
    @Test void transferringOutOfAnotherCustomersAccountIsRefusedAndNothingMoves() throws Exception {
        mvc.perform(post("/api/transfers").header("Authorization", bearer(alex)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"" + UUID.randomUUID() + "\",\"fromAccountId\":\"" + blakeCurrent.id + "\",\"toAccountId\":\"" + alexCurrent.id + "\",\"amount\":\"100.00\"}"))
            .andExpect(status().isNotFound());
        assertBalance(blakeCurrent, "900.00"); assertBalance(alexCurrent, "1065.45");
    }
    @Test void transferringIntoAnotherCustomersAccountIsRefusedAndNothingMoves() throws Exception {
        mvc.perform(post("/api/transfers").header("Authorization", bearer(alex)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"" + UUID.randomUUID() + "\",\"fromAccountId\":\"" + alexCurrent.id + "\",\"toAccountId\":\"" + blakeCurrent.id + "\",\"amount\":\"100.00\"}"))
            .andExpect(status().isNotFound());
        assertBalance(blakeCurrent, "900.00"); assertBalance(alexCurrent, "1065.45");
    }
    private void assertBalance(Account a, String expected) {
        accounts.flush();
        assertEquals(0, new BigDecimal(expected).compareTo(accounts.findById(a.id).orElseThrow().balance));
    }
}
