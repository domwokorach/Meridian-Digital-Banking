package com.meridian.banking.api;

import com.meridian.banking.api.Dtos.*;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class DtoValidationTest {
    final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    TransferRequest transfer(String amount) {
        return new TransferRequest(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), amount == null ? null : new BigDecimal(amount), "ref");
    }
    @Test void validTransferPasses() { assertTrue(validator.validate(transfer("25.50")).isEmpty()); }
    @Test void zeroNegativeAndSubPennyAmountsFail() {
        for (String bad : new String[]{"0", "0.00", "-1.00", "0.001"}) assertFalse(validator.validate(transfer(bad)).isEmpty(), bad);
    }
    @Test void moreThanTwoDecimalPlacesFail() { assertFalse(validator.validate(transfer("1.234")).isEmpty()); }
    @Test void missingAmountOrIdsFail() {
        assertFalse(validator.validate(transfer(null)).isEmpty());
        assertFalse(validator.validate(new TransferRequest(null, null, null, new BigDecimal("1.00"), null)).isEmpty());
    }
    @Test void overlongReferenceFails() {
        var req = new TransferRequest(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("1.00"), "x".repeat(121));
        assertFalse(validator.validate(req).isEmpty());
    }
    @Test void registrationRequiresNameValidEmailAndTenCharacterPassword() {
        assertTrue(validator.validate(new RegisterRequest("Alex", "alex@example.com", "ten-chars-ok")).isEmpty());
        assertFalse(validator.validate(new RegisterRequest("A", "alex@example.com", "ten-chars-ok")).isEmpty());
        assertFalse(validator.validate(new RegisterRequest("Alex", "not-an-email", "ten-chars-ok")).isEmpty());
        assertFalse(validator.validate(new RegisterRequest("Alex", "alex@example.com", "short")).isEmpty());
        assertFalse(validator.validate(new RegisterRequest("", "", "")).isEmpty());
    }
    @Test void loginRequiresBothFields() {
        assertFalse(validator.validate(new LoginRequest("", "x")).isEmpty());
        assertFalse(validator.validate(new LoginRequest("a@b.co", "")).isEmpty());
    }
}
