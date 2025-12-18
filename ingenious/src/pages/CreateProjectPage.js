import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./CreateProjectPage.css";

const CreateProjectPage = ({ user, onLogout, onCreate }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, title: "", assignee: "", deadline: "", description: "" },
  ]);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: tasks.length + 1,
        title: "",
        assignee: "",
        deadline: "",
        description: "",
      },
    ]);
  };

  const removeTask = (id) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const updateTask = (id, field, value) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, [field]: value } : task,
      ),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
    alert('Введите название проекта');
    return;
  }
  
    const validTasks = tasks.filter((t) => t.title.trim());

    onCreate({
      title,
      description,
      tasks: validTasks,
      members: members
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m),
      deadline: projectDeadline,
    });
    navigate("/");
  };

  return (
    <div className="create-project-page">
      <Header username={user.username} onLogout={onLogout} />
      <main className="page-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Назад
          </button>
          <h1>Новый проект</h1>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-section">
            <h3>Основная информация</h3>
            <div className="form-group">
              <label>Название проекта*</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Введите название проекта"
              />
            </div>

            <div className="form-group">
              <label>Описание проекта</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите проект"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Участники (логины через запятую)</label>
              <input
                type="text"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="username1, username2, username3"
              />
            </div>

            <div className="form-group">
              <label>Дедлайн проекта</label>
              <input
                type="date"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Задачи</h3>
              <button type="button" className="add-task-btn" onClick={addTask}>
                + Добавить задачу
              </button>
            </div>

            {tasks.map((task, index) => (
              <div key={task.id} className="task-form">
                <div className="task-header">
                  <h4>Задача #{index + 1}</h4>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="remove-task-btn"
                      onClick={() => removeTask(task.id)}
                    >
                      × Удалить
                    </button>
                  )}
                </div>

                <div className="task-grid">
                  <div className="form-group">
                    <label>Название задачи*</label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                      placeholder="Что нужно сделать?"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Назначена на</label>
                    <input
                      type="text"
                      value={task.assignee}
                      onChange={(e) =>
                        updateTask(task.id, "assignee", e.target.value)
                      }
                      placeholder="Логин участника"
                    />
                  </div>

                  <div className="form-group">
                    <label>Дедлайн задачи</label>
                    <input
                      type="date"
                      value={task.deadline}
                      onChange={(e) =>
                        updateTask(task.id, "deadline", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание задачи</label>
                  <textarea
                    value={task.description}
                    onChange={(e) =>
                      updateTask(task.id, "description", e.target.value)
                    }
                    placeholder="Детали задачи"
                    rows="2"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="create-btn">
              Создать проект
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateProjectPage;
