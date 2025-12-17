import React from "react";
import "./Header.css";

const Header = ({ username, onLogout }) => {
  return (
    <header className="header" style={{ backgroundImage: "url(/accent.jpg)" }}>
      <div className="header-left">
        <h0 className="logo">Ingenious</h0>
      </div>
      <div className="header-right">
        <span className="username">{username}</span>
        <button className="logout-btn" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;
