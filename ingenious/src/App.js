import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ProjectList from "./components/ProjectList";
import CreateProjectPage from "./pages/CreateProjectPage";
import "./styles/global.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mockUser = { username: "Иван Иванов" };
    setUser(mockUser);

    setProjects([
      {
        id: 1,
        title: "Проект1",
        progress: 33,
        tasks: [
          { id: 1, title: "Название задачи", status: "completed" },
          { id: 2, title: "Название задачи", status: "in-progress" },
          { id: 3, title: "Название задачи", status: "in-progress" },
        ],
      },
      {
        id: 2,
        title: "Проект2",
        progress: 50,
        tasks: [
          { id: 1, title: "Название задачи", status: "completed" },
          { id: 2, title: "Название задачи", status: "in-progress" },
        ],
      },
    ]);
  }, []);

  const handleCreateProject = (projectData) => {
    console.log("Создаем проект:", projectData);

    const newProject = {
      id: projects.length + 1,
      title: projectData.title,
      progress: 0,
      tasks: projectData.tasks
        ? projectData.tasks.map((task, i) => ({
            id: i + 1,
            title: task,
            status: "in-progress",
          }))
        : [],
    };

    setProjects([...projects, newProject]);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
    </Routes>
  );
}

export default App;
