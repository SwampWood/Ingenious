import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import api from "../api";
import "./EditProjectPage.css";

const EditProjectPage = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`projects/projects/${id}/`);
        setProject(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          deadline: response.data.deadline
            ? response.data.deadline.slice(0, 10)
            : "",
        });
        const memberUsernames = response.data.members.map(
          (m) => m.user.username,
        );
        setMembers(memberUsernames);
      } catch (error) {
        console.error("Ошибка загрузки проекта:", error);
        alert("Не удалось загрузить проект");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`projects/projects/${id}/`, formData);
      const newTasks = project.tasks.filter((task) =>
        task.id.toString().startsWith("new-"),
      );
      for (const task of newTasks) {
        await api.post("projects/tasks/", {
          project: id,
          title: task.title,
          description: task.description || "",
          status: task.status,
          deadline: task.deadline || null,
        });
      }

      alert("Проект обновлён!");
      window.location.href = "/";
    } catch (error) {
      console.error("Ошибка обновления:", error);
      alert("Не удалось обновить проект");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Удалить проект? Это действие нельзя отменить.")) {
      try {
        await api.delete(`projects/projects/${id}/`);
        alert("Проект удалён");
        window.location.href = "/";
      } catch (error) {
        console.error("Ошибка удаления:", error);
        alert("Не удалось удалить проект");
      }
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`projects/tasks/${taskId}/`, { status: newStatus });
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      }));
    } catch (error) {
      console.error("Ошибка обновления задачи:", error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Удалить задачу?")) return;
    try {
      await api.delete(`projects/tasks/${taskId}/`);
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      console.error("Ошибка удаления задачи:", error);
    }
  };

  const addNewTask = () => {
    const newTask = {
      id: `new-${Date.now()}`,
      title: "Новая задача",
      status: "todo",
      description: "",
    };
    setProject((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const updateTaskTitle = async (taskId, newTitle) => {
    if (taskId.toString().startsWith("new-")) {
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId ? { ...task, title: newTitle } : task,
        ),
      }));
    } else {
      try {
        await api.patch(`projects/tasks/${taskId}/`, { title: newTitle });
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, title: newTitle } : task,
          ),
        }));
      } catch (error) {
        console.error("Ошибка обновления названия:", error);
      }
    }
  };

  const updateTaskAssignee = async (taskId, username) => {
    const assignedUser = username ? { username } : null;

    if (taskId.toString().startsWith("new-")) {
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId ? { ...task, assigned_to: assignedUser } : task,
        ),
      }));
    } else {
      try {
        await api.patch(`projects/tasks/${taskId}/`, {
          assigned_to: username || null,
        });
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, assigned_to: assignedUser } : task,
          ),
        }));
      } catch (error) {
        console.error("Ошибка обновления назначения:", error);
      }
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!project) return <div>Проект не найден</div>;

  return (
    <div className="edit-project-page">
      <Header username={user.username} onLogout={onLogout} />
      <main className="page-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Назад
          </button>
          <h1>Редактировать проект</h1>
          <button className="delete-btn" onClick={handleDelete}>
            Удалить
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label>Название проекта</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Дедлайн</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <div className="tasks-section">
            <h3>Задачи проекта</h3>

            {project.tasks.map((task) => (
              <div key={task.id} className="task-row">
                <div className="task-main">
                  <div className="task-header-row">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                      className="task-title-input"
                      placeholder="Название задачи"
                    />
                    <select
                      value={task.assigned_to?.username || ""}
                      onChange={(e) =>
                        updateTaskAssignee(task.id, e.target.value)
                      }
                      className="task-assignee-select"
                    >
                      <option value="">Не назначена</option>
                      {members.map((username) => (
                        <option key={username} value={username}>
                          {username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="task-footer">
                    <span className={`task-status ${task.status}`}>
                      {task.status === "done"
                        ? "✅ Выполнена"
                        : task.status === "in_progress"
                          ? "🔄 В процессе"
                          : "⏳ К выполнению"}
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    type="button"
                    className="status-btn"
                    onClick={() => updateTaskStatus(task.id, "in_progress")}
                  >
                    В процессе
                  </button>
                  <button
                    type="button"
                    className="status-btn done"
                    onClick={() => updateTaskStatus(task.id, "done")}
                  >
                    Выполнена
                  </button>
                  <button
                    type="button"
                    className="delete-task-btn"
                    onClick={() => deleteTask(task.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="add-task-btn" onClick={addNewTask}>
              + Добавить задачу
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              Сохранить изменения
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditProjectPage;
