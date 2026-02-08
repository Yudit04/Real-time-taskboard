# Realtime Taskboard

A collaborative task management system that syncs instantly across multiple devices. Built to demonstrate high-performance backend logic and real-time state management.

## 🚀 Key Features

* **Real-Time Collaboration:** Changes made by one user (adding, moving, or deleting tasks) are instantly pushed to all other connected users via WebSockets. No page refreshes required.
* **Smart Reordering:** Tasks can be dragged and dropped to prioritize them.
* **Optimized Performance:** Uses a **Doubly Linked List** data structure in the database to handle task reordering in **$O(1)$ constant time**, ensuring scalability even with thousands of items.
* **Simple Interface:** Clean, reactive UI built with React.js.

## 🛠️ Tech Stack

* **Frontend:** React.js, `@hello-pangea/dnd` (Drag & Drop), Axios
* **Backend:** Java Spring Boot, Hibernate, WebSocket (STOMP)
* **Database:** PostgreSQL

## ⚙️ How to Run

### 1. Backend Setup
1.  Navigate to the `backend` folder.
2.  Open the project in IntelliJ IDEA (or your preferred Java IDE).
3.  Update `application.properties` with your PostgreSQL username/password.
4.  Run the `TaskboardBackendApplication` class.

### 2. Frontend Setup
1.  Open a terminal in the `frontend` folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npm start
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 How to Test Real-Time Sync
1.  Open the app in two separate browser tabs (or two different windows).
2.  Add a task in **Tab A**.
3.  Watch it appear instantly in **Tab B**.
4.  Drag a task in **Tab A** to a new position — **Tab B** will update automatically!