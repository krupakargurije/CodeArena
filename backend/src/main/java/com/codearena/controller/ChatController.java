package com.codearena.controller;

import com.codearena.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.Instant;

@Controller
@RequiredArgsConstructor
public class ChatController {

    @MessageMapping("/chat.send/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage sendMessage(@DestinationVariable String roomId, ChatMessage message) {
        // Set timestamp if not provided
        if (message.getTimestamp() == null || message.getTimestamp().isEmpty()) {
            message.setTimestamp(Instant.now().toString());
        }
        message.setRoomId(roomId);

        // TODO: Optionally persist to Supabase here for message history
        System.out.println("Chat message in room " + roomId + ": " + message.getContent());

        return message;
    }
}
