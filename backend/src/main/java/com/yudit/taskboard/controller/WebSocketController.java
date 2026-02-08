package com.yudit.taskboard.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @MessageMapping("/move-task")
    @SendTo("/topic/updates")
    public String handleTaskMove() {
        return "update";
    }
}