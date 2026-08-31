package com.sabyshop.repository;

import com.sabyshop.model.DeviceLoginLog;
import com.sabyshop.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceLoginLogRepository extends JpaRepository<DeviceLoginLog, Long> {
    @EntityGraph(attributePaths = {"user"})
    List<DeviceLoginLog> findAllByOrderByLoginTimeDesc();

    @EntityGraph(attributePaths = {"user"})
    List<DeviceLoginLog> findByUserOrderByLoginTimeDesc(User user);

    @EntityGraph(attributePaths = {"user"})
    List<DeviceLoginLog> findTop50ByOrderByLoginTimeDesc();

    @EntityGraph(attributePaths = {"user"})
    java.util.Optional<DeviceLoginLog> findFirstByUserAndDeviceIdOrderByLoginTimeDesc(User user, String deviceId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserAndDeviceId(User user, String deviceId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByDeviceId(String deviceId);
}
