package com.meridian.banking.api;

import com.meridian.banking.api.Dtos.*;
import com.meridian.banking.auth.JwtService;
import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {
    @Mock UserRepository users;
    @Mock AccountRepository accounts;
    @Mock TransactionRepository transactions;
    @Mock JwtService jwt;
    // Low cost keeps the unit test fast; production uses cost 12 (SecurityConfig).
    final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    AuthController controller() { return new AuthController(users, accounts, transactions, encoder, jwt); }

    @Test void registerNormalisesEmailHashesPasswordAndOpensTwoAccounts() {
        when(users.existsByEmail("new@example.com")).thenReturn(false);
        when(users.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(accounts.existsByAccountNumber(any())).thenReturn(false);
        when(accounts.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));
        when(jwt.create(any())).thenReturn("token");
        var response = controller().register(new RegisterRequest("  New Person ", "  NEW@Example.com ", "correct-horse-battery"));
        assertEquals("token", response.token());
        var user = ArgumentCaptor.forClass(User.class);
        verify(users).save(user.capture());
        assertEquals("new@example.com", user.getValue().email);
        assertEquals("New Person", user.getValue().fullName);
        assertNotEquals("correct-horse-battery", user.getValue().passwordHash);
        assertTrue(encoder.matches("correct-horse-battery", user.getValue().passwordHash));
        var saved = ArgumentCaptor.forClass(Account.class);
        verify(accounts, times(2)).save(saved.capture());
        BigDecimal total = saved.getAllValues().stream().map(a -> a.balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("6050.00").compareTo(total));
        saved.getAllValues().forEach(a -> assertTrue(a.accountNumber.matches("\\d{8}")));
        verify(transactions, times(2)).save(any(BankTransaction.class));
    }
    @Test void registeringAnExistingEmailConflicts() {
        when(users.existsByEmail("taken@example.com")).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> controller().register(new RegisterRequest("Name", "taken@example.com", "correct-horse-battery")));
        assertEquals(HttpStatus.CONFLICT, ex.status);
        verify(users, never()).save(any());
    }
    @Test void loginWithCorrectPasswordReturnsAToken() {
        User user = new User("Alex", "alex@example.com", encoder.encode("Demo1234!"));
        when(users.findByEmail("alex@example.com")).thenReturn(Optional.of(user));
        when(jwt.create(user.id)).thenReturn("signed");
        var response = controller().login(new LoginRequest(" Alex@Example.com ", "Demo1234!"));
        assertEquals("signed", response.token());
        assertEquals("alex@example.com", response.user().email());
    }
    @Test void wrongPasswordAndUnknownEmailGiveTheSameError() {
        User user = new User("Alex", "alex@example.com", encoder.encode("Demo1234!"));
        when(users.findByEmail("alex@example.com")).thenReturn(Optional.of(user));
        when(users.findByEmail("nobody@example.com")).thenReturn(Optional.empty());
        ApiException wrong = assertThrows(ApiException.class, () -> controller().login(new LoginRequest("alex@example.com", "nope")));
        ApiException unknown = assertThrows(ApiException.class, () -> controller().login(new LoginRequest("nobody@example.com", "x")));
        assertEquals(HttpStatus.UNAUTHORIZED, wrong.status);
        assertEquals(wrong.getMessage(), unknown.getMessage());
        verifyNoInteractions(jwt);
    }
}
