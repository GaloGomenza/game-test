package com.game.game.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    private String id;

    private String username;

    private String password;

    private int highscore;

    private String role;

    public boolean isAdmin() {
        return "ROLE_ADMIN".equals(role);
    }
}
