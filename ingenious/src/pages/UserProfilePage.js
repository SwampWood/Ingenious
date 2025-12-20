import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './UserProfilePage.css';

const UserProfilePage = ({ user, onLogout }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsWithUser, setProjectsWithUser] = useState([]);

  const from = location.state?.from || '/';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await api.get(`users/users/${userId}/`);
        setProfileUser(userResponse.data);

        const projectsResponse = await api.get(`projects/projects/?participant=${userId}`);
        setProjectsWithUser(projectsResponse.data);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost${avatarPath}`;
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!profileUser) return <div>Пользователь не найден</div>;

  return (
    <div className="user-profile-page">
      <Header username={user.username} onLogout={onLogout} />
      <main className="profile-content">
        <div className="profile-header">
          <button 
            className="back-btn" 
            onClick={() => navigate(from)}
          >
            ← Назад
          </button>
          <h1>Профиль пользователя</h1>
        </div>

        <div className="profile-card">
          <div className="avatar-section">
            {profileUser.avatar ? (
              <img 
                src={getAvatarUrl(profileUser.avatar)} 
                alt={profileUser.username}
                className="avatar-large"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="avatar-large-placeholder">
                {profileUser.username[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h2>{profileUser.username}</h2>
            <p><strong>Email:</strong> {profileUser.email || 'Не указан'}</p>
            <p><strong>Дата регистрации:</strong> {new Date(profileUser.date_joined).toLocaleDateString()}</p>
            
            {profileUser.bio && (
              <div className="bio-section">
                <h3>О себе:</h3>
                <p className="bio-text">{profileUser.bio}</p>
              </div>
            )}

            <div className="projects-section">
              <h3>Участвует в проектах:</h3>
              {projectsWithUser.length > 0 ? (
                <div className="projects-list">
                  {projectsWithUser.map(project => (
                    <div key={project.id} className="project-item-view">
                      <div className="project-info">
                        <span className="project-title">{project.title}</span>
                        <div className="project-meta">
                          <span className="project-progress">
                            Прогресс: {project.progress}%
                          </span>
                          <span className="project-tasks">
                            Задач: {project.tasks?.length || 0}
                          </span>
                          <span className="project-role">
                            {project.creator.id === parseInt(userId) ? 'Создатель' : 'Участник'}
                          </span>
                        </div>
                        {project.description && (
                          <p className="project-description">{project.description}</p>
                        )}
                      </div>
                      {project.deadline && (
                        <div className="project-deadline">
                          До: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-projects">Не участвует в проектах</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
