package com.yudit.taskboard.service;

import com.yudit.taskboard.dto.MoveTaskRequest;
import com.yudit.taskboard.model.Task;
import com.yudit.taskboard.repository.TaskRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @Transactional
    public Task createTask(Task task) {
        Task lastTask = taskRepository.findAll().stream()
                .filter(t -> t.getStatus().equals(task.getStatus()) && t.getNextTaskId() == null)
                .findFirst()
                .orElse(null);

        if (lastTask != null) {
            task.setPrevTaskId(lastTask.getId());
            lastTask.setNextTaskId(null); // Will update after save
        }

        Task savedTask = taskRepository.save(task);

        if (lastTask != null) {
            lastTask.setNextTaskId(savedTask.getId());
            taskRepository.save(lastTask);
        }
        return savedTask;
    }

    @Transactional
    public void moveTask(MoveTaskRequest request) {
        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String oldStatus = task.getStatus();
        String newStatus = request.getStatus();

        healNeighbors(task);

        task.setPrevTaskId(request.getNewPrevId());
        task.setNextTaskId(request.getNewNextId());
        task.setStatus(newStatus);
        taskRepository.save(task);

        if (request.getNewPrevId() != null) {
            Task newPrev = taskRepository.findById(request.getNewPrevId()).orElse(null);
            if (newPrev != null) {
                newPrev.setNextTaskId(task.getId());
                taskRepository.save(newPrev);
            }
        }

        if (request.getNewNextId() != null) {
            Task newNext = taskRepository.findById(request.getNewNextId()).orElse(null);
            if (newNext != null) {
                newNext.setPrevTaskId(task.getId());
                taskRepository.save(newNext);
            }
        }
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        healNeighbors(task);
        taskRepository.delete(task);
    }

    private void healNeighbors(Task task) {
        Long prevId = task.getPrevTaskId();
        Long nextId = task.getNextTaskId();

        if (prevId != null) {
            taskRepository.findById(prevId).ifPresent(t -> {
                t.setNextTaskId(nextId);
                taskRepository.save(t);
            });
        }
        if (nextId != null) {
            taskRepository.findById(nextId).ifPresent(t -> {
                t.setPrevTaskId(prevId);
                taskRepository.save(t);
            });
        }
    }
}