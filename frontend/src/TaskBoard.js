import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// SIMPLIFIED: Hardcoded localhost for stability. 
// If you want to use your phone later, change this to your IP (e.g., http://192.168.1.3:8080)
const API_BASE_URL = "http://localhost:8080";

const COLUMNS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done"
};

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const stompClient = useRef(null);

  // 1. Fetch Tasks (No Auth Header needed anymore)
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }, []);

  // 2. Connect WebSocket
  const connectWebSocket = useCallback(() => {
    const socket = new SockJS(`${API_BASE_URL}/ws-taskboard`);
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = () => {}; // Disable verbose debug logs
    stompClient.current.connect({}, () => {
      stompClient.current.subscribe('/topic/updates', () => {
        fetchTasks();
      });
    });
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
    connectWebSocket();
    return () => { if (stompClient.current) stompClient.current.disconnect(); };
  }, [fetchTasks, connectWebSocket]);

  // 3. Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskData = {
      title: newTaskTitle,
      description: newTaskDesc || "No description",
      status: "TODO" // Default column
    };

    try {
      await axios.post(`${API_BASE_URL}/api/tasks`, taskData);
      // Notify others via WebSocket
      if (stompClient.current?.connected) {
        stompClient.current.send("/app/move-task", {}, "update");
      }
      setNewTaskTitle("");
      setNewTaskDesc("");
      fetchTasks();
    } catch (err) {
      console.error("Failed to add task", err);
      alert("Failed to connect to backend. Is it running?");
    }
  };

  // 4. Delete Task
  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`);
      if (stompClient.current?.connected) {
        stompClient.current.send("/app/move-task", {}, "update");
      }
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  // 5. Drag & Drop Logic
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const destColumnId = destination.droppableId; 
    
    // Calculate new neighbors based on the visual list
    const destTasks = sortTasks(tasks.filter(t => t.status === destColumnId));
    
    // Logic to find the task *before* and *after* the drop position
    const prevTask = destTasks[destination.index - 1];
    const nextTask = destTasks[destination.index];

    const moveRequest = {
      taskId: draggableId,
      newPrevId: prevTask ? prevTask.id : null,
      newNextId: nextTask ? nextTask.id : null,
      status: destColumnId
    };

    try {
      // Optimistic update (optional, but we just wait for server for simplicity)
      await axios.post(`${API_BASE_URL}/api/tasks/move`, moveRequest);
      if (stompClient.current?.connected) {
          stompClient.current.send("/app/move-task", {}, JSON.stringify(moveRequest));
      }
      fetchTasks();
    } catch (err) {
      console.error("Move failed", err);
      fetchTasks();
    }
  };

  // 6. Safe Sorting (Prevents disappearing tasks)
  const sortTasks = (taskList) => {
    if (!taskList || taskList.length === 0) return [];
    
    const sorted = [];
    const taskMap = new Map(taskList.map(t => [t.id, t]));
    
    // Find head(s)
    let current = taskList.find(t => !t.prevTaskId);
    
    // Traverse chain
    while (current) {
      sorted.push(current);
      taskMap.delete(current.id);
      current = taskMap.get(current.nextTaskId);
    }

    // Append orphans (safety net for broken data)
    if (taskMap.size > 0) {
      sorted.push(...Array.from(taskMap.values()));
    }
    
    return sorted;
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Input Form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" placeholder="Task Title" value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{ padding: '10px', width: '200px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          type="text" placeholder="Description" value={newTaskDesc}
          onChange={(e) => setNewTaskDesc(e.target.value)}
          style={{ padding: '10px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Task</button>
      </form>

      {/* Columns */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.keys(COLUMNS).map(columnId => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  style={{ 
                    background: '#ebecf0', padding: '15px', width: '300px', 
                    borderRadius: '8px', minHeight: '500px' 
                  }}
                >
                  <h4 style={{ textTransform: 'uppercase', color: '#5E6C84', marginBottom: '10px' }}>{COLUMNS[columnId]}</h4>
                  
                  {sortTasks(tasks.filter(t => t.status === columnId)).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          style={{
                            userSelect: 'none', padding: '16px', margin: '0 0 10px 0',
                            backgroundColor: snapshot.isDragging ? '#e3f2fd' : 'white', 
                            borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            position: 'relative',
                            ...provided.draggableProps.style
                          }}
                        >
                          <strong>{task.title}</strong>
                          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#555' }}>{task.description}</p>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            style={{ position: 'absolute', top: '5px', right: '5px', border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
};

export default TaskBoard;