package com.game.game.controller;

import com.game.game.dto.UserRegistrationDto;
import com.game.game.entity.User;
import com.game.game.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new UserRegistrationDto());
        return "register";
    }

    @PostMapping("/register")
    public String register(@Valid @ModelAttribute("user") UserRegistrationDto dto,
                           BindingResult result, HttpServletRequest request) {
        if (result.hasErrors()) {
            return "register";
        }
        try {
            userService.register(dto);
            UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword());
            Authentication auth = authenticationManager.authenticate(authToken);
            SecurityContextHolder.getContext().setAuthentication(auth);
            request.getSession(true);
            return "redirect:/dashboard";
        } catch (IllegalArgumentException e) {
            result.rejectValue("username", "error.user", e.getMessage());
            return "register";
        }
    }

    @GetMapping("/dashboard")
    public String dashboard(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        model.addAttribute("user", user);
        model.addAttribute("leaderboard", userService.getTopPlayers(10));
        return "dashboard";
    }

    @GetMapping("/profile")
    public String profile(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        model.addAttribute("user", user);
        return "profile";
    }

    @PostMapping("/profile/delete")
    public String deleteAccount(Authentication auth, RedirectAttributes redirectAttributes) {
        userService.deleteAccount(auth.getName());
        redirectAttributes.addFlashAttribute("success", "Account deleted.");
        return "redirect:/login";
    }
}
