package com.example.studentmanagement.repository;

import com.example.studentmanagement.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByToUsernameOrderBySentAtDesc(String toUsername);
    List<Message> findByFromUsernameOrderBySentAtDesc(String fromUsername);
}
