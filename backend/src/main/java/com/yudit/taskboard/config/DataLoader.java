package com.yudit.taskboard.config;

import com.yudit.taskboard.model.User;
import com.yudit.taskboard.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataLoader(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("yudit").isEmpty()) {
            User user = new User();
            user.setUsername("yudit");
            user.setPassword("pass123");
            userRepository.save(user);
            System.out.println("✅ Default user created: yudit / pass123");
        }
    }
}