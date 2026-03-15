import React from "react";
import { useNavigate } from 'react-router-dom';
import "./Header.css";

const Header = ({ username, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header" style={{ backgroundImage: 'url(/accent.jpg)' }}>
      <div className="header-left">
        <h0 className="logo">Ingenious</h0>
      </div>
      <div className="header-right">
        <span className="username" onClick={() => navigate('/profile')}>
          {username}
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;
