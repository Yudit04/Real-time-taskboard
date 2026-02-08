import React from 'react';
import TaskBoard from './TaskBoard';

function App() {
  return (
    <div className="App">
      <div style={{ background: '#0052CC', padding: '20px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Project Alpha</h2>
      </div>
      <TaskBoard />
    </div>
  );
}

export default App;