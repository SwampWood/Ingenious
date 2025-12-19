import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import CustomSelect from '../components/CustomSelect';
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
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    status: "todo",
    assigned_to: null,
  });

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
          assigned_to: task.assigned_to?.id || null,
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
      assigned_to: null,
    };
    setProject((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    openEditTaskModal(newTask);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      status: task.status,
      assigned_to: task.assigned_to?.id || null,
    });
  };

  const saveTaskChanges = async () => {
    if (!editingTask) return;

    try {
      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description,
        deadline: taskFormData.deadline || null,
        status: taskFormData.status,
        assigned_to: taskFormData.assigned_to,
      };

      if (editingTask.id.toString().startsWith("new-")) {
        await api.post("projects/tasks/", {
          project: id,
          ...taskData,
        });
      } else {
        await api.patch(`projects/tasks/${editingTask.id}/`, taskData);
      }

      const response = await api.get(`projects/projects/${id}/`);
      setProject(response.data);
      setEditingTask(null);
    } catch (error) {
      console.error("Ошибка сохранения задачи:", error);
      alert("Не удалось сохранить изменения");
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!project) return <div>Проект не найден</div>;

  const getMemberIdByUsername = (username) => {
    const member = project.members.find((m) => m.user.username === username);
    return member ? member.user.id : null;
  };

  const statusOptions = [
    { value: 'todo', label: 'К выполнению' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'done', label: 'Выполнено' }
  ];

  const assigneeOptions = [
    { value: '', label: 'Не назначена' },
    ...(project.members?.map(member => ({
      value: member.user.id,
      label: member.user.username
    })) || [])
  ];

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
              <div
                key={task.id}
                className="task-row"
                onClick={() => openEditTaskModal(task)}
                style={{ cursor: "pointer" }}
              >
                <div className="task-main">
                  <div className="task-header-row">
                    <div className="task-title">{task.title}</div>
                    <div className="task-assignee">
                      {task.assigned_to?.username || "Не назначена"}
                    </div>
                  </div>

                  <div className="task-footer">
                    <span className={`task-status ${task.status}`}>
                      {task.status === "done"
                        ? "✅ Выполнена"
                        : task.status === "in_progress"
                        ? "🔄 В процессе"
                        : "⏳ К выполнению"}
                    </span>
                    {task.deadline && (
                      <span className="task-deadline">
                        📅 {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    type="button"
                    className="delete-task-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
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

        {editingTask && (
          <div className="modal-overlay" onClick={() => setEditingTask(null)}>
            <div
              className="modal-content task-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Редактировать задачу</h3>
                <button
                  className="close-btn"
                  onClick={() => setEditingTask(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Название задачи</label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) =>
                      setTaskFormData({ ...taskFormData, title: e.target.value })
                    }
                    placeholder="Название задачи"
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Описание задачи"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Дедлайн</label>
                    <input
                      type="date"
                      value={taskFormData.deadline}
                      onChange={(e) =>
                        setTaskFormData({
                          ...taskFormData,
                          deadline: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Статус</label>
                    <CustomSelect
                      value={taskFormData.status}
                      onChange={(value) => setTaskFormData({...taskFormData, status: value})}
                      options={statusOptions}
                      placeholder="Выберите статус"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Назначена на</label>
                  <CustomSelect
                    value={taskFormData.assigned_to || ''}
                    onChange={(value) => setTaskFormData({
                      ...taskFormData, 
                      assigned_to: value || null
                    })}
                    options={assigneeOptions}
                    placeholder="Выберите участника"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Отмена
                </button>
                <button className="btn-primary" onClick={saveTaskChanges}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditProjectPage;