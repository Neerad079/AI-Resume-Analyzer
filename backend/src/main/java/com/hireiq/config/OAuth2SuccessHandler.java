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
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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

        String targetUrl = String.format(
                "http://localhost:5173/login?token=%s&email=%s&name=%s&userId=%s",
                URLEncoder.encode(jwtToken, StandardCharsets.UTF_8),
                URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getFullName(), StandardCharsets.UTF_8),
                user.getId()
        );

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
