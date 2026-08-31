package com.sabyshop.repository;

import com.sabyshop.model.Role;
import com.sabyshop.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    Optional<User> findFirstByRole(Role role);
    long countByRole(Role role);
    Optional<User> findByTelegramChatId(String telegramChatId);
    List<User> findByRoleAndTelegramChatIdIsNotNull(Role role);
}
