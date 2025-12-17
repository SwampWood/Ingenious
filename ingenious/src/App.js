import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ProjectList from "./components/ProjectList";
import CreateProjectPage from "./pages/CreateProjectPage";
import EditProjectPage from "./pages/EditProjectPage";
import ProjectChatPage from './pages/ProjectChatPage';
import LoginPage from './pages/LoginPage';
import api from "./api";
import "./styles/global.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && location.pathname !== '/login') {
      navigate('/login');
      return;
    }

    const fetchUserAndProjects = async () => {
    try {
      const userResponse = await api.get('users/me/');
      setUser(userResponse.data);

      const projectsResponse = await api.get('projects/projects/');
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

    if (token) {
      fetchUserAndProjects();
      setUser({ username: 'Пользователь' });
    }
  }, [location.pathname, navigate]);

  const handleCreateProject = async (projectData) => {
    try {
      const response = await api.post("projects/projects/", {
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline || null,
        creator: 1,
      });

      for (const task of projectData.tasks) {
        await api.post("projects/tasks/", {
          project: response.data.id,
          title: task.title,
          description: task.description || "",
          assigned_to: task.assignee || null,
          deadline: task.deadline || null,
          status: "todo",
        });
      }

      const projectsResponse = await api.get("projects/projects/");
      setProjects(projectsResponse.data);

      navigate("/");
    } catch (error) {
      console.error("Ошибка создания:", error);
      alert("Не удалось создать проект");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) return <div>Загрузка...</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="App">
            <Header username={user.username} onLogout={handleLogout} />
            <main className="main-content">
              <div className="section-header">
                <h2>Создать проект</h2>
                <button
                  className="create-project-btn"
                  onClick={() => navigate("/create")}
                >
                  + Новый проект
                </button>
              </div>

              <h3>Мои проекты:</h3>
              <ProjectList projects={projects} />
            </main>
          </div>
        }
      />

      <Route
        path="/create"
        element={
          <CreateProjectPage
            user={user}
            onLogout={handleLogout}
            onCreate={handleCreateProject}
          />
        }
      />

      <Route
        path="/projects/:id/edit"
        element={<EditProjectPage user={user} onLogout={handleLogout} />}
      />

      <Route
        path="/projects/:id/chat"
        element={<ProjectChatPage user={user} onLogout={handleLogout} />}
      />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
