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
          setTotalXP(data.user.totalXP);
        }
      })
      .catch((err) => console.error('Error fetching /me:', err));
  }, []);

  // When we have a user, fetch that user's quests
  useEffect(() => {
    // If not authenticated, show login (or register) UI
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
        setQuests(data);
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
                  setTotalXP(data.user.totalXP); // Fixed showing 0 after logging in then show actual xp
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
  const completeQuest = async (questId, reward) => {
    try {
      const resp = await fetch(`http://localhost:5050/quests/${questId}`, {
        method: "PATCH",
        credentials: "include", // send cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });
      if (!resp.ok) throw new Error("Failed to complete quest");

      const json = await resp.json();
      // JSON: { message: "Quest completed", total_xp: <new_total> }

      // 1) Update local totalXP to match the server
      setTotalXP(json.totalXP);

      // 2) Remove that quest from local state
      setQuests((prev) => prev.filter((q) => q.id !== questId));
    } catch (err) {
      console.error("Error completing quest:", err);
      alert("Could not complete quest.");
    }
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
          onCompleteQuest={() => {
            const q = quests[currentQuestIndex];
            completeQuest(q.id, q.reward);
          }}
        />
      )}
      
      {showAddQuest && (
        <AddQuest
          onAddQuest={(savedQuest) => {
            // savedQuest comes back from the server (with an `id`).
            setQuests((prev) => [...prev, savedQuest]);
            setShowAddQuest(false);
          }}
          onClose={handleHideAddQuest}
        />
      )}
    </div>
  );
}

export default App;