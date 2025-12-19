import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ProjectList.css";

const ProjectList = ({ projects }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedProject, setExpandedProject] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showInfo, setShowInfo] = useState(null);
  const [showMembers, setShowMembers] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleProject = (id) => {
    setExpandedProject(expandedProject === id ? null : id);
  };

  const toggleOptions = (id, e) => {
    e.stopPropagation();
    setShowOptions(showOptions === id ? null : id);
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:8000${avatarPath}`;
  };

  return (
    <div className="project-list">
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <div className="project-header">
            <div className="project-title">{project.title}</div>

            <div className="progress-section">
              <div className="percent">{project.progress}%</div>
              <div
                className="circle"
                style={{
                  background: `conic-gradient(var(--primary) 0% ${project.progress}%, #e0e0e0 ${project.progress}% 100%)`,
                }}
              />
            </div>

            <div className="action-section">
              <div className="more-menu">
                <button
                  className="action-btn more-btn"
                  onClick={(e) => toggleOptions(project.id, e)}
                >
                  ⋯
                </button>

                {showOptions === project.id && (
                  <div className="more-options" ref={menuRef}>
                    <button className="option-btn" onClick={() => {
                      setShowInfo(project.id);
                      setShowOptions(null);
                    }}>
                      Информация
                    </button>
                    <button
                      className="option-btn"
                      onClick={() => navigate(`/projects/${project.id}/edit`)}
                    >
                      Редактировать
                    </button>
                    <button className="option-btn" onClick={() => setShowMembers(project.id)}>
                      Участники
                    </button>
                    <button 
                      className="option-btn" 
                      onClick={() => navigate(`/projects/${project.id}/chat`)}
                    >
                      Чат проекта
                    </button>
                  </div>
                )}
              </div>

              <button
                className="action-btn expand-btn"
                onClick={() => toggleProject(project.id)}
              >
                {expandedProject === project.id ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {expandedProject === project.id && (
            <div className="task-list">
              {project.tasks.map((task) => (
                <div key={task.id} className="task-item">
                  <span>{task.title}</span>
                  <div
                    className={`status ${task.status === "done" ? "completed" : "in-progress"}`}
                  >
                    {task.status === "done"
                      ? "Выполнена"
                      : task.status === "in_progress"
                        ? "В процессе"
                        : "К выполнению"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(null)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Информация о проекте</h3>
              <button className="close-btn" onClick={() => setShowInfo(null)}>×</button>
            </div>
            
            {projects.find(p => p.id === showInfo) && (
              <div className="modal-body">
                <h4>{projects.find(p => p.id === showInfo).title}</h4>
                <p>{projects.find(p => p.id === showInfo).description}</p>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Статус:</span>
                    <span className="value">
                      {projects.find(p => p.id === showInfo).is_completed ? 'Завершён' : 'Активный'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Прогресс:</span>
                    <span className="value">{projects.find(p => p.id === showInfo).progress}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Дедлайн:</span>
                    <span className="value">
                      {projects.find(p => p.id === showInfo).deadline 
                        ? new Date(projects.find(p => p.id === showInfo).deadline).toLocaleDateString('ru-RU')
                        : 'Не установлен'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Задач:</span>
                    <span className="value">{projects.find(p => p.id === showInfo).tasks?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showMembers && (
        <div className="modal-overlay" onClick={() => setShowMembers(null)}>
          <div className="modal-content members-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Участники проекта</h3>
              <button className="close-btn" onClick={() => setShowMembers(null)}>×</button>
            </div>
            
            {projects.find(p => p.id === showMembers).members.map(member => (
              <div 
                key={member.id} 
                className="member-item"
                onClick={() => {
                  setShowMembers(null);
                  navigate(`/profile/${member.user.id}`, {
                    state: { from: location.pathname }
                  });
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="member-avatar-large-container">
                  {member.user.avatar ? (
                    <img 
                      src={getAvatarUrl(member.user.avatar)} 
                      alt={member.user.username}
                      className="avatar-img-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'avatar-fallback-large';
                        fallback.textContent = member.user.username[0].toUpperCase();
                        e.target.parentElement.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <div className="avatar-fallback-large">
                      {member.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="member-info">
                  <div className="member-name">{member.user.username}</div>
                  <div className="member-role">
                    {member.role === 'creator' ? 'Создатель' : 'Участник'}
                  </div>
                  <div className="view-profile-hint">Нажмите для просмотра профиля →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;