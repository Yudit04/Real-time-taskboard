package com.yudit.taskboard.dto;

import lombok.Data;

@Data
public class MoveTaskRequest {
    private Long taskId;
    private Long newPrevId;
    private Long newNextId;
    private String status;
}