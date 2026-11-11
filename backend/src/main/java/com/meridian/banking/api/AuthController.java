package com.meridian.banking.api;

import com.meridian.banking.api.Dtos.*;
import com.meridian.banking.auth.JwtService;
import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final SecureRandom random = new SecureRandom();
    public AuthController(UserRepository users, AccountRepository accounts, TransactionRepository transactions,
                          PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.accounts = accounts; this.transactions = transactions;
        this.encoder = encoder; this.jwt = jwt;
    }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        var user = users.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        if (!encoder.matches(request.password(), user.passwordHash))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password");
        return new AuthResponse(jwt.create(user.id), UserView.of(user));
    }
    @Transactional @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        // Portfolio simulation only: new members receive fictional opening deposits.
        var user = users.save(new User(request.fullName().trim(), email, encoder.encode(request.password())));
        for (String type : new String[]{"CURRENT", "SAVINGS"}) {
            String number = generateAccountNumber();
            Account account = new Account(user.id, number,
                type.equals("CURRENT") ? "Everyday account" : "Rainy day savings", type);
            account.balance = new BigDecimal(type.equals("CURRENT") ? "4250.00" : "1800.00");
            accounts.save(account);
            transactions.save(new BankTransaction(account.id, null, "CREDIT", "Opening demo funds",
                account.balance, account.balance, Instant.now()));
        }
        return new AuthResponse(jwt.create(user.id), UserView.of(user));
    }
    private String generateAccountNumber() {
        String number;
        do { number = String.format("%08d", random.nextInt(100_000_000)); }
        while (accounts.existsByAccountNumber(number));
        return number;
    }
}
