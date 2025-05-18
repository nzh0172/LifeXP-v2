import React from 'react';
import '../styles/QuestDetail.css';

function QuestDetail({ quest, onHideDetail, onAcceptQuest, onGiveupQuest, onCompleteQuest }) {
  if (!quest) return null;

  return (
    <div className="task-detail active">
      <button className="close" onClick={onHideDetail}>X</button>
      <h2 className="quest-title">
        {quest.icon || '📜'} {quest.title}
        <span className="status">{quest.status}</span>
      </h2>
      <p><strong>Backstory:</strong></p>
      <p className="quest-backstory">{quest.backstory}</p>
      <p><strong>Objective:</strong></p>
      <p className="quest-objective">{quest.objective}</p>
      <p><strong>Reward:</strong></p>
      <p className="quest-reward">{quest.reward}</p>
      <div className="detail-buttons">
        {quest.status === "Yet to Embark" && (
          <button className="accept" onClick={onAcceptQuest}>✅ Accept</button>
        )}
        {quest.status === "In Progress" && (
          <>
            <button className="giveup" onClick={onGiveupQuest}>❌ Give Up</button>
            <button className="complete" onClick={onCompleteQuest}>✅ Complete</button>
          </>
        )}
      </div>
    </div>
  );
}

export default QuestDetail;