import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.post('token-auth/', {
        username: credentials.username,
        password: credentials.password
      });
      
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (error) {
      console.error('Ошибка входа:', error);
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="login-page">
      <div
        className="login-sidebar"
        style={{ backgroundImage: "url(/accent.jpg)" }}
      >
        <div className="sidebar-content">
          <h1 className="sidebar-title">Ingenious</h1>
          <p className="sidebar-subtitle">Платформа для ваших проектов</p>
        </div>
      </div>
      
      <div className="login-main">
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">Вход в систему</h2>
          
          <div className="form-group">
            <label className="form-label">Логин или email</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
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
              value={credentials.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-btn">
            Войти
          </button>
          
          <p className="register-link">
            Нет аккаунта?{' '}
            <Link to="/register" className="register-text">
              Зарегистрируйтесь
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
