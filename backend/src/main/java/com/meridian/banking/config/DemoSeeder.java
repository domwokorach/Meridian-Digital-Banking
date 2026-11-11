package com.meridian.banking.config;

import com.meridian.banking.domain.*;
import com.meridian.banking.repo.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Configuration
public class DemoSeeder {
    @Bean CommandLineRunner seed(UserRepository users, AccountRepository accounts, TransactionRepository txns,
                                  PasswordEncoder encoder, @Value("${app.seed-demo}") boolean seedDemo) {
        return args -> {
            if (!seedDemo || users.existsByEmail("demo@meridian.test")) return;
            var user = users.save(new User("Alex Morgan", "demo@meridian.test", encoder.encode("Demo1234!")));
            var current = accounts.save(new Account(user.id, "48271936", "Everyday account", "CURRENT"));
            var savings = accounts.save(new Account(user.id, "68104472", "Rainy day savings", "SAVINGS"));
            var now = Instant.now();
            add(txns, current, "CREDIT", "Opening demo funds", "1400.00", now.minus(45, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "DEBIT", "Rent · Orchard Living", "1240.00", now.minus(24, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "DEBIT", "Groceries · Green Market", "68.45", now.minus(12, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "CREDIT", "Salary · Acme Studio", "1149.00", now.minus(8, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "DEBIT", "Coffee · Brew Collective", "9.80", now.minus(5, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "DEBIT", "Transport · City Rail", "38.40", now.minus(3, java.time.temporal.ChronoUnit.DAYS));
            add(txns, current, "DEBIT", "Shopping · Studio Supply", "126.90", now.minus(1, java.time.temporal.ChronoUnit.DAYS));
            add(txns, savings, "CREDIT", "Opening demo funds", "5541.00", now.minus(45, java.time.temporal.ChronoUnit.DAYS));
            add(txns, savings, "CREDIT", "Monthly savings interest", "16.24", now.minus(6, java.time.temporal.ChronoUnit.DAYS));
            accounts.saveAll(List.of(current, savings));
        };
    }
    private static void add(TransactionRepository txns, Account a, String kind, String description, String value, Instant date) {
        BigDecimal amount = new BigDecimal(value);
        a.balance = kind.equals("CREDIT") ? a.balance.add(amount) : a.balance.subtract(amount);
        txns.save(new BankTransaction(a.id, null, kind, description, amount, a.balance, date));
    }
}
