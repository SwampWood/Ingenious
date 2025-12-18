import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ProjectList from "./components/ProjectList";
import CreateProjectPage from "./pages/CreateProjectPage";
import EditProjectPage from "./pages/EditProjectPage";
import ProjectChatPage from './pages/ProjectChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import api from "./api";
import "./styles/global.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
      
      if (!token && !isAuthPage) {
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }

      if (token && isAuthPage) {
        navigate('/', { replace: true });
        setIsLoading(false);
        return;
      }

      if (token && !isAuthPage) {
        try {
          const userResponse = await api.get('users/me/');
          setUser(userResponse.data);

          const projectsResponse = await api.get('projects/projects/');
          setProjects(projectsResponse.data);
        } catch (error) {
          console.error('Ошибка загрузки:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login', { replace: true });
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  const handleCreateProject = async (projectData) => {
    try {
      console.log('Создание проекта:', projectData.title);
      
      const response = await api.post("projects/projects/", {
        title: projectData.title,
        description: projectData.description,
        deadline: projectData.deadline || null,
      });

      const projectId = response.data.id;
      console.log('Проект создан, ID:', projectId);

      if (projectData.members && projectData.members.length > 0) {
        console.log('Добавляем участников:', projectData.members);
        for (const memberUsername of projectData.members) {
          try {
            await api.post(`projects/projects/${projectId}/add_member/`, {
              username: memberUsername
            });
            console.log(`Участник ${memberUsername} добавлен`);
          } catch (memberError) {
            console.warn(`Не удалось добавить участника ${memberUsername}:`, memberError.response?.data);
          }
        }
      }

      console.log('Создаем задачи:', projectData.tasks.length);
      for (const task of projectData.tasks) {
        let assignedToId = null;
        
        if (task.assignee && task.assignee.trim()) {
          try {
            const usersResponse = await api.get(`users/users/?username=${task.assignee}`);
            
            if (usersResponse.data && usersResponse.data.length > 0) {
              assignedToId = usersResponse.data[0].id;
              console.log(`Задача "${task.title}" назначена на ${task.assignee} (ID: ${assignedToId})`);
            } else {
              console.warn(`Пользователь ${task.assignee} не найден для задачи "${task.title}"`);
            }
          } catch (userError) {
            console.warn(`Ошибка поиска пользователя ${task.assignee}:`, userError);
          }
        }

        try {
          await api.post("projects/tasks/", {
            project: projectId,
            title: task.title,
            description: task.description || "",
            assigned_to_id: assignedToId,
            deadline: task.deadline || null,
            status: "todo",
          });
          console.log(`Задача "${task.title}" создана`);
        } catch (taskError) {
          console.error(`Ошибка создания задачи "${task.title}":`, taskError.response?.data);
        }
      }

      const projectsResponse = await api.get("projects/projects/");
      setProjects(projectsResponse.data);

      navigate("/");
    } catch (error) {
      console.error("Ошибка создания проекта:", error.response?.data || error);
      
      let errorMessage = "Не удалось создать проект";
      
      if (error.response?.data) {
        if (error.response.data.title) {
          errorMessage = `Ошибка в названии: ${error.response.data.title.join(', ')}`;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProjects([]);
    navigate("/login", { replace: true });
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    
    try {
      const projectsResponse = await api.get('projects/projects/');
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
    
    navigate('/', { replace: true });
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
    
    try {
      const projectsResponse = await api.get('projects/projects/');
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
    
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return <div className="loading-screen">Загрузка...</div>;
  }

  if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="App">
            <Header username={user?.username || 'Пользователь'} onLogout={handleLogout} />
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

      <Route 
        path="/login" 
        element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
      />
      
      <Route 
        path="/register" 
        element={<RegisterPage onRegisterSuccess={handleRegisterSuccess} />}
      />
      
      <Route 
        path="/profile" 
        element={<ProfilePage user={user} onLogout={handleLogout} />}
      />

      <Route 
        path="*" 
        element={<div>Страница не найдена</div>}
      />
    </Routes>
  );
}

export default App;