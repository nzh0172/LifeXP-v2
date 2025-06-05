import React from 'react';
import '../styles/QuestList.css';

function QuestList({ quests, onShowDetail }) {
  // Helper function to get status CSS class
  const getStatusClass = (status) => {
    switch (status) {
      case "Yet to Embark":
        return "yet";
      case "In Progress":
        return "progress";
      case "Completed":
        return "complete";
      default:
        return "";
    }
  };

  return (
    <div className="cards-container">
      {quests.map((quest, index) => (
        // Give a green border in card for accepted quest
        <div className={`card${quest.status === "In Progress" ? " in-progress" : ""}`} key={index}>
        <div className="card-content">
            <div className="ch3">{quest.icon || "📜"} {quest.title}</div>
            <div className="xp">+{quest.reward} XP</div>
            {quest.status && (
              <div className={`status ${getStatusClass(quest.status)}`}>
                {quest.status}
              </div>
            )}
            <div className="card-buttonrow">
              <button 
                className="carddetail-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetail(index);
                }}
              >
                ✦ Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuestList;