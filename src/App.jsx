import React, { useState, useEffect, useCallback} from 'react';
import './App.css';
import Header from './components/Header.jsx';
import QuestList from './components/QuestList.jsx';
import QuestDetail from './components/QuestDetail.jsx';
import AddQuest from './components/AddQuest.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';

function App() {
  // State for user auth
  const [user, setUser] = useState(null);          // null or { id, username }
  const [showRegister, setShowRegister] = useState(false);

  // State for quests data
  const [quests, setQuests] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(-1);

  // useEffect calls first on top to ensure hooks are never invoked conditionally.
  // ------------ LOGIN ------------------------------------
  // On app load, check if already logged in
  useEffect(() => {
    fetch('http://localhost:5050/me', {
      method: 'GET',
      credentials: 'include', // so cookie is sent
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setTotalXP(data.user.totalXP)
        }
      })
      .catch((err) => console.error('Error fetching /me:', err));
  }, []);

  // If not authenticated, show login (or register) UI
  useEffect(() => {
    if (!user) return;

    // Example: fetch quests from protected endpoint
    fetch('http://localhost:5050/quests', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch quests');
        }
        return res.json();
      })
      .then((data) => {
      // Example #1: if your backend returns { quests: […], totalXP: <number> }
      if (Array.isArray(data.quests)) {
        setQuests(data.quests);
        setTotalXP(data.totalXP ?? 0);
        return;
      }

      // Example #2: if your backend just returns an array of quests (and no totalXP),
      // you can compute totalXP on the client by summing up the `reward` field of completed quests:
      if (Array.isArray(data)) {
        setQuests(data);
        const xpFromCompleted = data
          .filter((q) => q.status === 'Completed')
          .reduce((sum, q) => sum + (q.reward || 0), 0);
        setTotalXP(xpFromCompleted);
        return;
      }

      // Fallback: if shape is something else, just clear out
      setQuests([]);
      setTotalXP(0);
      })
      .catch((err) => console.error(err));
  }, [user]);

    // Initialize quests if empty
    const initializeQuests = useCallback(() => {
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
    }, [quests.length]);


  // Other UI overlay on top
  useEffect(() => {
    document.body.classList.toggle('add-quest-open', showAddQuest);
    document.body.classList.toggle('detail-open', showDetail);
  }, [showAddQuest, showDetail]);

  // -----------------------------------------------------------------
  // If not logged in
  if (!user) {
    return showRegister ? (
      <Register
        onRegisterSuccess={() => {
          setShowRegister(false);
        }}
        onCancel={() => setShowRegister(false)}
      />
    ) : (
      <div>
        <Login
          onLoginSuccess={() => {
            // Re‐fetch /me to get user info
            fetch('http://localhost:5050/me', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.user) {
                  setUser(data.user);
                }
              })
              .catch((err) => console.error('Error fetching /me:', err));
          }}
        />
        <p style={{ textAlign: 'center' }}>
          Don't have an account?{' '}
          <button onClick={() => setShowRegister(true)}>Register</button>
        </p>
      </div>
    );
  }




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

  // ─── LOGOUT HANDLER ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    fetch('http://localhost:5050/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (res.ok) {
          setUser(null);
          // Optionally clear quest state
          setQuests([]);
          setTotalXP(0);
        }
      })
      .catch((err) => console.error('Logout error:', err));
  };

  return (
    <div className="App">
      <Header 
        totalXP={totalXP} 
        onShowAddQuest={handleShowAddQuest}>
        <div>
          <span style={{ marginRight: '1rem' }}>👤 {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
        </Header>

      
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