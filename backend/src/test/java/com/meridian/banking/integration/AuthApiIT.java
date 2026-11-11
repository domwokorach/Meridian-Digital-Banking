package com.meridian.banking.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import java.math.BigDecimal;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthApiIT extends TransactionalIntegrationTest {
    @Autowired PasswordEncoder encoder;
    static final String PASSWORD = "correct-horse-battery";

    private String json(String name, String email, String password) {
        return "{\"fullName\":\"" + name + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }
    private String register(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json("Casey Test", email, PASSWORD)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty()).andReturn();
        return r.getResponse().getContentAsString();
    }

    @Test void registrationStoresAHashedPasswordAndOpensTwoFictionalAccounts() throws Exception {
        String email = "reg-" + UUID.randomUUID() + "@example.test";
        register(email);
        var user = users.findByEmail(email).orElseThrow();
        assertNotEquals(PASSWORD, user.passwordHash);
        assertTrue(encoder.matches(PASSWORD, user.passwordHash));
        var owned = accounts.findByUserIdOrderByAccountTypeAsc(user.id);
        assertEquals(2, owned.size());
        assertEquals(0, new BigDecimal("6050.00").compareTo(owned.stream().map(a -> a.balance).reduce(BigDecimal.ZERO, BigDecimal::add)));
    }
    @Test void registeredUserCanLogInAndReadTheirProfile() throws Exception {
        String email = "login-" + UUID.randomUUID() + "@example.test";
        register(email);
        MvcResult login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email.toUpperCase() + "\",\"password\":\"" + PASSWORD + "\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.user.email").value(email)).andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(login.getResponse().getContentAsString(), "$.token");
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email)).andExpect(jsonPath("$.fullName").value("Casey Test"));
    }
    @Test void duplicateRegistrationIsAConflict() throws Exception {
        String email = "twice-" + UUID.randomUUID() + "@example.test";
        register(email);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json("Casey Test", email, PASSWORD)))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.error").isNotEmpty());
    }
    @Test void wrongPasswordIsUnauthorisedWithAGenericMessage() throws Exception {
        String email = "wrong-" + UUID.randomUUID() + "@example.test";
        register(email);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\",\"password\":\"not-the-password\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Incorrect email or password"));
    }
    @Test void unknownEmailGetsTheSameMessage() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"ghost@example.test\",\"password\":\"whatever\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Incorrect email or password"));
    }
    @Test void invalidRegistrationInputIsRejectedWithAClearError() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json("Casey", "not-an-email", PASSWORD)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("email")));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json("Casey", "ok@example.test", "short")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("password")));
    }
    @Test void malformedJsonIsABadRequestWithoutLeakingDetails() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{not json"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Invalid request body"));
    }
}
