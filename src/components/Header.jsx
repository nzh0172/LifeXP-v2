import React from 'react';
import '../styles/Header.css';

function Header({ totalXP, xpPopup, popupKey, onShowAddQuest, children}) {
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

        {/*To place logout button via main, can't put here since user is null on first run*/}
        {/*In React, anything you put between <Header>…</Header> is passed to the Header component as a special prop called children.
         If your Header JSX never references {children}, then that nested content is simply ignored. */}
        {children}
      </div>
    </div>
  );
}

export default Header;
