package com.meridian.banking.integration;

import com.meridian.banking.auth.JwtService;
import com.meridian.banking.domain.Account;
import com.meridian.banking.domain.User;
import com.meridian.banking.repo.AccountRepository;
import com.meridian.banking.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Base for tests that run against the isolated PostgreSQL test database (profile "test").
 * Safety: the context refuses to start unless the target database name ends in "_test",
 * so these tests can never run against the development "meridian" database.
 */
@SpringBootTest
@ActiveProfiles("test")
abstract class IntegrationTestBase {
    private static final Pattern TEST_DB = Pattern.compile("^jdbc:postgresql://[^/]+/[^/?]*_test(\\?.*)?$");

    @DynamicPropertySource
    static void testProperties(DynamicPropertyRegistry registry) {
        String url = System.getenv("TEST_DB_URL");
        if (url != null && !TEST_DB.matcher(url).matches())
            throw new IllegalStateException("Refusing to run integration tests: TEST_DB_URL must point at a database whose name ends with _test");
        if (System.getenv("TEST_DB_PASSWORD") == null)
            throw new IllegalStateException("TEST_DB_PASSWORD is not set. Export the isolated test database password (see docs/JENKINS.md).");
        // Random per-run signing key: no JWT secret is stored in the repository.
        registry.add("app.jwt-secret", () -> UUID.randomUUID() + "-" + UUID.randomUUID());
    }

    @Autowired protected UserRepository users;
    @Autowired protected AccountRepository accounts;
    @Autowired protected JwtService jwt;

    protected User newUser(String label) {
        return users.saveAndFlush(new User("Test " + label, label + "-" + UUID.randomUUID() + "@example.test", "not-a-real-hash"));
    }
    protected Account newAccount(User owner, String name, String type, String balance) {
        Account a = new Account(owner.id, String.format("%08d", Math.abs(UUID.randomUUID().getMostSignificantBits() % 100_000_000L)), name, type);
        a.balance = new BigDecimal(balance);
        return accounts.saveAndFlush(a);
    }
    protected String bearer(User user) { return "Bearer " + jwt.create(user.id); }
}
