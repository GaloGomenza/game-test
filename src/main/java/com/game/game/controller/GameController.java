package com.game.game.controller;

import com.game.game.entity.User;
import com.game.game.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameController {

    private final UserService userService;

    @GetMapping("/game")
    public String game(Authentication auth, Model model) {
        User user = userService.findByUsername(auth.getName());
        model.addAttribute("user", user);
        model.addAttribute("leaderboard", userService.getTopPlayers(10));
        return "game";
    }

    @PostMapping("/game/submit-score")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> submitScore(Authentication auth,
                                                           @RequestBody Map<String, Integer> body) {
        int score = body.getOrDefault("score", 0);
        int currentHighscore = userService.findByUsername(auth.getName()).getHighscore();
        int newHighscore = userService.updateHighscore(auth.getName(), score);
        boolean isNewHighscore = newHighscore > currentHighscore;
        return ResponseEntity.ok(Map.of(
                "isNewHighscore", isNewHighscore,
                "highscore", newHighscore
        ));
    }
}
