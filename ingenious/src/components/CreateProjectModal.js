import React, { useState } from "react";
import "./CreateProjectModal.css";

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState("");
  const [members, setMembers] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      tasks: tasks.split("\n").filter((t) => t.trim()),
      members: members
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m),
      deadline,
    });
    setTitle("");
    setDescription("");
    setTasks("");
    setMembers("");
    setDeadline("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Новый проект</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название проекта</label>
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
            <label>Задачи (каждая с новой строки)</label>
            <textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="Задача 1&#10;Задача 2&#10;Задача 3"
              rows="4"
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
            <label>Дедлайн</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="back-btn" onClick={onClose}>
              Назад
            </button>
            <button type="submit" className="create-btn">
              Создать проект
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
