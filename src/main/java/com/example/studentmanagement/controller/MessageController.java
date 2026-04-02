package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Message;
import com.example.studentmanagement.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;

    /** Any authenticated user can send a message */
    @PostMapping
    public ResponseEntity<Message> send(@RequestBody Message msg, Authentication auth) {
        msg.setFromUsername(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(messageRepository.save(msg));
    }

    /** Teacher inbox — messages sent TO this teacher by students */
    @GetMapping("/inbox")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public List<Message> inbox(Authentication auth) {
        return messageRepository.findByToUsernameOrderBySentAtDesc(auth.getName());
    }

    /** Student inbox — messages sent TO this student by teachers */
    @GetMapping("/my-inbox")
    public List<Message> studentInbox(Authentication auth) {
        return messageRepository.findByToUsernameOrderBySentAtDesc(auth.getName());
    }

    /** Messages sent BY the current user */
    @GetMapping("/sent")
    public List<Message> sent(Authentication auth) {
        return messageRepository.findByFromUsernameOrderBySentAtDesc(auth.getName());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Message> markRead(@PathVariable Long id, Authentication auth) {
        return messageRepository.findById(id)
                .filter(m -> m.getToUsername().equals(auth.getName()))
                .map(m -> {
                    m.setReadByRecipient(true);
                    return ResponseEntity.ok(messageRepository.save(m));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Mark ALL inbox messages as read for the current user — clears the badge */
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        List<Message> unread = messageRepository.findByToUsernameOrderBySentAtDesc(auth.getName())
                .stream().filter(m -> !m.isReadByRecipient()).toList();
        unread.forEach(m -> m.setReadByRecipient(true));
        messageRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        long count = messageRepository.findByToUsernameOrderBySentAtDesc(auth.getName())
                .stream().filter(m -> !m.isReadByRecipient()).count();
        return Map.of("count", count);
    }
}
