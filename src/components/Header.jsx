import React from 'react';
import '../styles/Header.css';

function Header({ totalXP, onShowAddQuest }) {
  return (
    <div className="header">
      <div>
        <h1 className="logo">🧭 LifeXP</h1>
      </div>
      <div className="right-section">
        <div className="xp-box">
          <span className="xp-icon">✨</span>
          <span className="xp-amount">{totalXP} XP</span>
        </div>
        <button className="addtask-btn" onClick={onShowAddQuest}>➕ New Task</button>
      </div>
    </div>
  );
}

export default Header;