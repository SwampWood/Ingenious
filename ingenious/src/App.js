import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import './styles/global.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setUser({ username: 'Иван Иванов' });
    setProjects([
      { id: 1, title: 'Проект1', progress: 20, tasks: [] },
      { id: 2, title: 'Проект2', progress: 50, tasks: [] }
    ]);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) return <div>Загрузка...</div>;

  return (
    <div className="App">
      <Header username={user.username} onLogout={handleLogout} />
      <main className="main-content">
        <div className="section-header">
          <h2>Создать проект</h2>
          <button className="create-project-btn">+ Новый проект</button>
        </div>
        
        <h3>Мои проекты:</h3>
        <ProjectList projects={projects} />
      </main>
    </div>
  );
}

export default App;