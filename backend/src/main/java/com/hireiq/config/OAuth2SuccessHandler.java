package com.hireiq.config;

import com.hireiq.model.User;
import com.hireiq.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:}")
    private String configuredFrontendUrl;

    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsStr;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (name == null || name.isBlank()) {
            name = email != null ? email.split("@")[0] : "Google User";
        }

        log.info("Spring Security OAuth2 Success for email: {}", email);

        final String userEmail = email;
        final String userName = name;

        User user = userRepository.findByEmail(userEmail).orElseGet(() -> {
            User newUser = User.builder()
                    .email(userEmail)
                    .fullName(userName)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .build();
            return userRepository.save(newUser);
        });

        String jwtToken = jwtService.generateToken(user);

        List<String> allowedList = Arrays.stream(allowedOriginsStr.split(","))
                .map(String::trim)
                .map(s -> s.replaceAll("/+$", ""))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        String frontendBaseUrl = null;
        if (configuredFrontendUrl != null && !configuredFrontendUrl.isBlank()) {
            frontendBaseUrl = configuredFrontendUrl.replaceAll("/+$", "");
        } else {
            String origin = request.getHeader("Origin");
            if (origin == null || origin.isBlank()) {
                String referer = request.getHeader("Referer");
                if (referer != null && !referer.contains("accounts.google.com") && !referer.contains("google.com")) {
                    origin = referer;
                }
            }
            if (origin != null && !origin.isBlank()) {
                try {
                    java.net.URI uri = java.net.URI.create(origin);
                    String candidate = (uri.getScheme() + "://" + uri.getAuthority()).replaceAll("/+$", "");
                    if (allowedList.contains(candidate)) {
                        frontendBaseUrl = candidate;
                    }
                } catch (Exception ignored) {}
            }
            if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
                for (String allowed : allowedList) {
                    if (!allowed.contains("*")) {
                        frontendBaseUrl = allowed;
                        break;
                    }
                }
            }
            if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
                frontendBaseUrl = "http://localhost:5173";
            }
        }

        String targetUrl = String.format(
                "%s/login?token=%s&email=%s&name=%s&userId=%s",
                frontendBaseUrl,
                URLEncoder.encode(jwtToken, StandardCharsets.UTF_8),
                URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getFullName(), StandardCharsets.UTF_8),
                user.getId()
        );

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
