import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const translateError = (message) => {
    const translations = {
      'This password is too short. It must contain at least 8 characters.': 
        'Пароль слишком короткий. Минимум 8 символов.',
      'This password is too common.': 
        'Пароль слишком простой.',
      'The password is too similar to the username.':
        'Пароль слишком похож на логин.',
    };
    return translations[message] || message;
  };

  const getFirstError = (errors) => {
    if (!errors) return 'Ошибка регистрации';

    for (const field in errors) {
      if (Array.isArray(errors[field]) && errors[field].length > 0) {
        return translateError(errors[field][0]);
      }
      if (typeof errors[field] === 'string') {
        return translateError(errors[field]);
      }
    }
    
    return 'Ошибка регистрации';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      return;
    }
    
    try {
      const response = await api.post('users/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2
      });
      
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (error) {
      console.error('Полная ошибка:', error.response?.data);
      setError(getFirstError(error.response?.data));
    }
  };

  return (
    <div className="register-page">
      <div
        className="register-sidebar"
        style={{ backgroundImage: "url(/accent.jpg)" }}
      >
        <div className="sidebar-content">
          <h1 className="sidebar-title">Ingenious</h1>
          <p className="sidebar-subtitle">Платформа для ваших проектов</p>
        </div>
      </div>
      
      <div className="register-main">
        <form onSubmit={handleSubmit} className="register-form">
          <h2 className="form-title">Регистрация</h2>
          
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Повторите пароль</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="register-btn">
            Зарегистрироваться
          </button>
          
          <p className="register-link">
            Уже есть аккаунт?{' '}
            <Link to="/register" className="register-text">
              Вход
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
