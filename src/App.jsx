import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import QuestList from './components/QuestList.jsx';
import QuestDetail from './components/QuestDetail.jsx';
import AddQuest from './components/AddQuest.jsx';

function App() {
  // State for quests data
  const [quests, setQuests] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(-1);

  // Initialize quests on component mount
  useEffect(() => {
    initializeQuests();
  }, []);

  // Initialize quests if empty
  const initializeQuests = () => {
    if (quests.length === 0) {
      setQuests([
        {
          title: "The Scrolls of Wisdom",
          backstory: "The ancient tomes await, heavy with knowledge...",
          objective: "study",
          reward: 1000,
          icon: "📖",
          status: "Yet to Embark",
        },
        {
          title: "Sanity Run",
          backstory: "Madness brews like a storm in your skull...",
          objective: "jog",
          reward: 900,
          icon: "🏃‍♀️",
          status: "Yet to Embark",
        },
        {
          title: "Brew of Awakening",
          backstory: "The morning fog clings to your mind...",
          objective: "make a cup of coffee.",
          reward: 850,
          icon: "🔮",
          status: "Yet to Embark",
        },
      ]);
    }
  };

  // Open quest detail view
  const handleShowDetail = (index) => {
    setCurrentQuestIndex(index);
    setShowDetail(true);
  };

  // Close quest detail view
  const handleHideDetail = () => {
    setShowDetail(false);
  };

  // Show add quest form
  const handleShowAddQuest = () => {
    setShowAddQuest(true);
  };

  // Hide add quest form
  const handleHideAddQuest = () => {
    setShowAddQuest(false);
  };

  // Accept a quest
  const acceptQuest = (index) => {
    const updatedQuests = [...quests];
    updatedQuests[index] = {
      ...updatedQuests[index],
      status: "In Progress"
    };
    setQuests(updatedQuests);
    alert(`Quest accepted! ${updatedQuests[index].title} is now in progress.`);
  };

  // Give up on a quest
  const giveupQuest = () => {
    if (window.confirm("Are you sure you want to give up on this quest?")) {
      const updatedQuests = [...quests];
      updatedQuests.splice(currentQuestIndex, 1);
      setQuests(updatedQuests);
      setShowDetail(false);
    }
  };

  // Complete a quest
  const completeQuest = () => {
    const reward = quests[currentQuestIndex].reward;
    setTotalXP(prevXP => prevXP + reward);
    
    const updatedQuests = [...quests];
    updatedQuests.splice(currentQuestIndex, 1);
    setQuests(updatedQuests);
    
    alert(`Quest completed! You earned ${reward} XP.`);
    setShowDetail(false);
  };

  // Add a new quest
  const addQuest = (questData) => {
    setQuests([...quests, questData]);
    setShowAddQuest(false);
  };

  // Other UI overlay on top
  useEffect(() => {
    document.body.classList.toggle('add-quest-open', showAddQuest);
    document.body.classList.toggle('detail-open', showDetail);
  }, [showAddQuest, showDetail]);
  

  return (
    <div className="App">
      <Header 
        totalXP={totalXP} 
        onShowAddQuest={handleShowAddQuest} 
      />
      
      <QuestList 
        quests={quests} 
        onShowDetail={handleShowDetail} 
      />
      
      {showDetail && (
        <QuestDetail 
          quest={quests[currentQuestIndex]} 
          onHideDetail={handleHideDetail}
          onAcceptQuest={() => acceptQuest(currentQuestIndex)}
          onGiveupQuest={giveupQuest}
          onCompleteQuest={completeQuest}
        />
      )}
      
      {showAddQuest && (
        <AddQuest 
          onAddQuest={addQuest} 
          onClose={handleHideAddQuest} 
        />
      )}
    </div>
  );
}

export default App;