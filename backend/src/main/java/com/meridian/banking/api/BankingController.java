package com.meridian.banking.api;

import com.meridian.banking.api.Dtos.*;
import com.meridian.banking.repo.UserRepository;
import com.meridian.banking.service.BankingService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController @RequestMapping("/api")
public class BankingController {
    private final BankingService service;
    private final UserRepository users;
    public BankingController(BankingService service, UserRepository users) { this.service = service; this.users = users; }
    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }
    @GetMapping("/me")
    public UserView me(Authentication auth) { return users.findById(userId(auth)).map(UserView::of).orElseThrow(); }
    @GetMapping("/accounts")
    public List<AccountView> accounts(Authentication auth) { return service.accounts(userId(auth)); }
    @GetMapping("/accounts/{id}/transactions")
    public List<TransactionView> transactions(Authentication auth, @PathVariable UUID id, @RequestParam(defaultValue = "50") int limit) {
        return service.history(userId(auth), id, limit);
    }
    @PostMapping("/transfers")
    public TransferView transfer(Authentication auth, @Valid @RequestBody TransferRequest request) {
        return service.transfer(userId(auth), request);
    }
    @GetMapping("/accounts/{id}/statement")
    public ResponseEntity<byte[]> statement(Authentication auth, @PathVariable UUID id, @RequestParam LocalDate from, @RequestParam LocalDate to) {
        String csv = service.statementCsv(userId(auth), id, from, to);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=meridian-statement-" + from + "-" + to + ".csv")
            .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
