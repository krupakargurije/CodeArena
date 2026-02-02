package com.codearena.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {
    private String roomId;
    private String senderId;
    private String senderName;
    private String content;
    private String timestamp;
}
