import React from 'react';
import './styles.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <h1>QPS-AI</h1>
      <div className="user-profile-icon">👤</div>
    </header>
  );
};

export default Header;