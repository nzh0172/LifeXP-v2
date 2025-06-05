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

  // State for floating XP popup after completing quest
  const [xpPopup, setXpPopup] = useState(null);

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
  const acceptQuest = async (questId) => {
    try {
      const resp = await fetch(`http://localhost:5050/quests/${questId}/accept`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) throw new Error('Failed to accept quest');

      const { status } = await resp.json(); // { id: 4, status: "In Progress" }
      // Update local state: find the quest and set its new status
      setQuests(prev => prev.map(q =>
        q.id === questId
          ? { ...q, status }
          : q
      ));
    } catch (err) {
      console.error('Error accepting quest:', err);
    }
  };

  // Give up on a quest
  const giveupQuest = async (questId) => {
    try {
      const resp = await fetch(
        `http://localhost:5050/quests/${questId}/giveup`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to delete quest');
      }

      // Remove it from local state so the UI updates immediately
      setQuests(prev => prev.filter(q => q.id !== questId));
      setShowDetail(false);
    } catch (err) {
      console.error('Error giving up quest:', err);
      alert('Could not remove quest.');
    }
  };

  // Complete a quest 
  const completeQuest = async (questId) => {
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

      // 3) Show a floating XP popup
      const rewardGained = quests.find(q => q.id === questId)?.reward || 0;
      if (rewardGained > 0) {
        // Use a unique “key” so React re-renders even if the same reward appears twice quickly
        setXpPopup({ amount: rewardGained, key: Date.now() });
        // After 1s (animation length), clear the popup
        setTimeout(() => setXpPopup(null), 1000);
      }

      // 4) Close the detail overlay so it no longer blocks the UI
      setShowDetail(false);

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

      {xpPopup && (
        <div key={xpPopup.key} className="xp-popup">
          +{xpPopup.amount} XP
        </div>
      )}
      
      <QuestList 
        quests={quests} 
        onShowDetail={handleShowDetail} 
      />
      
      {showDetail && (
        <QuestDetail 
          quest={quests[currentQuestIndex]} 
          onHideDetail={handleHideDetail}
          onAcceptQuest={() => {
            const q = quests[currentQuestIndex];
            if (q) acceptQuest(q.id);
          }}
          onGiveupQuest={() => {
            const q = quests[currentQuestIndex];
            giveupQuest(q.id);
          }}
          onCompleteQuest={() => {
            const q = quests[currentQuestIndex];
            completeQuest(q.id);
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