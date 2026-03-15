import React, { useState } from 'react';
import axios from "axios"
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './RegisterPage.css';

const RegisterPage = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      'A user with that username already exists.':
        'Пользователь с таким логином уже существует.',
      'user with this username already exists.':
        'Пользователь с таким логином уже существует.',
      'Enter a valid email address.':
        'Введите корректный email адрес.',
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
      if (typeof errors[field] === 'object') {
        const nestedError = getFirstError(errors[field]);
        if (nestedError !== 'Ошибка регистрации') {
          return nestedError;
        }
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
    
    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/users/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2
      });

      console.log('Response data:', response.data);

      localStorage.setItem('token', response.data.token);

      const userResponse = await api.get('users/me/');
      const userData = userResponse.data;

      if (onRegisterSuccess) {
        onRegisterSuccess(userData);
      } else {
        navigate('/');
      }
      
    } catch (error) {
      console.error('Ошибка регистрации:', error.response?.data);
      
      if (error.response?.status === 400) {
        setError(getFirstError(error.response.data));
      } else if (error.response?.status === 500) {
        setError('Ошибка сервера. Попробуйте позже');
      } else if (error.response?.status === 403) {
        setError('Ошибка сервера. Credentials not provided');
      } else {
        setError('Ошибка сети. Проверьте подключение к интернету');
      }
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
              minLength={1}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="register-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          
          <p className="login-link">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="login-text">
              Вход
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;