import React from 'react';
import './styles.css';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-logo">🤖</div>
      <h2>What's on your mind today?</h2>
    </div>
  );
};

export default WelcomeScreen;