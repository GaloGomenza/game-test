package com.game.game.config;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient() {
        String uri = System.getenv("MONGODB_URI");
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException("MONGODB_URI environment variable is not set!");
        }
        System.out.println(">>> Connecting to MongoDB via MONGODB_URI");
        return MongoClients.create(uri);
    }
}
