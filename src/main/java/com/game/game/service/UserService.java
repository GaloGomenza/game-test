package com.game.game.service;

import com.game.game.dto.UserRegistrationDto;
import com.game.game.entity.User;
import com.game.game.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.isAdmin() ? "ADMIN" : "USER")
                .build();
    }

    public User register(UserRegistrationDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .highscore(0)
                .role("ROLE_USER")
                .build();
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public int updateHighscore(String username, int score) {
        User user = findByUsername(username);
        if (score > user.getHighscore()) {
            user.setHighscore(score);
            userRepository.save(user);
        }
        return user.getHighscore();
    }

    public void deleteAccount(String username) {
        User user = findByUsername(username);
        userRepository.delete(user);
    }

    public List<User> getTopPlayers(int limit) {
        return userRepository.findTop10ByOrderByHighscoreDesc();
    }
}
