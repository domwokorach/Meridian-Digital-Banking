package com.meridian.banking.integration;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/** Every test runs in a transaction that is rolled back, so the test database is left untouched. */
@AutoConfigureMockMvc
@Transactional
abstract class TransactionalIntegrationTest extends IntegrationTestBase {
    @Autowired protected MockMvc mvc;
}
