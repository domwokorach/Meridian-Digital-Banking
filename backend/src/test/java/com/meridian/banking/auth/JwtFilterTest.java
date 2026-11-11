package com.meridian.banking.auth;

import com.meridian.banking.repo.UserRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtFilterTest {
    final JwtService jwt = new JwtService(UUID.randomUUID() + "-" + UUID.randomUUID());
    final UserRepository users = mock(UserRepository.class);
    final JwtFilter filter = new JwtFilter(jwt, users);
    final FilterChain chain = mock(FilterChain.class);

    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    private void run(String header) throws Exception {
        var request = new MockHttpServletRequest();
        if (header != null) request.addHeader("Authorization", header);
        filter.doFilter(request, new MockHttpServletResponse(), chain);
    }
    @Test void validTokenAuthenticatesTheUser() throws Exception {
        UUID id = UUID.randomUUID();
        when(users.existsById(id)).thenReturn(true);
        run("Bearer " + jwt.create(id));
        assertEquals(id.toString(), SecurityContextHolder.getContext().getAuthentication().getName());
    }
    @Test void missingHeaderLeavesRequestAnonymous() throws Exception {
        run(null);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(any(), any());
    }
    @Test void invalidTokenLeavesRequestAnonymous() throws Exception {
        run("Bearer garbage");
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
    @Test void tokenForADeletedUserIsNotAuthenticated() throws Exception {
        UUID id = UUID.randomUUID();
        when(users.existsById(id)).thenReturn(false);
        run("Bearer " + jwt.create(id));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
    @Test void nonBearerSchemesAreIgnored() throws Exception {
        run("Basic abc");
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
