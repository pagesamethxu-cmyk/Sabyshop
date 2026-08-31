package com.sabyshop.repository;

import com.sabyshop.model.User;
import com.sabyshop.model.UserDevice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    @EntityGraph(attributePaths = {"user"})
    Optional<UserDevice> findByUserAndDeviceId(User user, String deviceId);

    @EntityGraph(attributePaths = {"user"})
    List<UserDevice> findByUser(User user);

    @EntityGraph(attributePaths = {"user"})
    List<UserDevice> findByUserAndStatus(User user, String status);

    @EntityGraph(attributePaths = {"user"})
    List<UserDevice> findByStatus(String status);

    @EntityGraph(attributePaths = {"user"})
    Optional<UserDevice> findByDeviceId(String deviceId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE UserDevice d SET d.status = 'REVOKED'")
    void revokeAllDevicesInSystem();
}
