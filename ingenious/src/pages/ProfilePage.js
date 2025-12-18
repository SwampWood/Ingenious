import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './ProfilePage.css';

const ProfilePage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ bio: '', avatar: null });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/me/');
      setProfile(response.data);
      setFormData({ bio: response.data.bio || '', avatar: null });
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const handleSave = async () => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('bio', formData.bio);
      if (formData.avatar) {
        formDataObj.append('avatar', formData.avatar);
      }
      await api.patch('users/users/profile/', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  if (!profile) return <div>Загрузка...</div>;

  return (
    <div className="profile-page">
      <Header username={user.username} onLogout={onLogout} />
      <main className="profile-content">
        <h1>Профиль</h1>
        <div className="profile-card">
          <div className="avatar-section">
            {profile.avatar ? (
              <img 
                src={profile.avatar ? `http://localhost:8000${profile.avatar}` : null} 
                alt="Аватар" 
                className="avatar"
              />
            ) : (
              <div className="avatar-placeholder">{profile.username[0]}</div>
            )}
            {editing && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, avatar: e.target.files[0]})}
                className="avatar-upload"
              />
            )}
          </div>

          <div className="profile-info">
            <h2>{profile.username}</h2>
            <p><strong>Email:</strong> {profile.email}</p>
            
            {editing ? (
              <>
                <label><strong>О себе:</strong></label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="bio-input"
                  rows="4"
                  placeholder="Расскажите о себе"
                />
                <div className="profile-actions">
                  <button className="save-btn" onClick={handleSave}>Сохранить</button>
                  <button className="cancel-btn" onClick={() => setEditing(false)}>Отмена</button>
                </div>
              </>
            ) : (
              <>
                <p><strong>О себе:</strong> {profile.bio || 'Не указано'}</p>
                <button className="edit-btn" onClick={() => setEditing(true)}>Редактировать профиль</button>
              </>
            )}
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('/')}>← Назад к проектам</button>
      </main>
    </div>
  );
};

export default ProfilePage;