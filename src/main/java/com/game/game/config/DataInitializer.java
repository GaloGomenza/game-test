package com.game.game.config;

import com.game.game.entity.User;
import com.game.game.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .highscore(0)
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Admin user created (username: admin, password: admin123)");
        }
    }
}
