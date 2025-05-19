import { useState } from 'react';
import '../styles/AddQuest.css';

export default function AddQuest({ onAddQuest, onClose }) {
  const [newTask, setNewTask] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [formatError, setFormatError] = useState(false);

  const callOllama = async () => {
    if (!newTask.trim()) {
      alert("Please enter a task first!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: newTask }),
      });

      const data = await response.json();

      const formatted = `Title: ${data.title}\nBackstory: ${data.backstory}\nObjective: ${data.objective}\nReward: ${data.reward} XP\nIcon: ${data.icon}`;
      setOutputPrompt(formatted);

      // Auto-validate
      const isValid = /^Title:\s*(.+)\nBackstory:\s*((?:.|\n)*?)\nObjective:\s*(.+)\nReward:\s*(\d+)\s*XP\s*(?:\nIcon:\s*(.+))?$/i.test(formatted.trim());
      setFormatError(!isValid);
    } catch (err) {
      console.error("Error generating quest:", err);
      alert("Something went wrong generating the quest.");
    }
  };

  const handleTaskChange = (e) => {
    setNewTask(e.target.value);
  };

  const addQuest = () => {
    if (formatError) {
      alert("Invalid quest format.");
      return;
    }

    const titleMatch = outputPrompt.match(/Title:\s*(.+)/i);
    const backstoryMatch = outputPrompt.match(/Backstory:\s*((?:.|\n)*?)\nObjective:/i);
    const objectiveMatch = outputPrompt.match(/Objective:\s*(.+)/i);
    const rewardMatch = outputPrompt.match(/Reward:\s*(\d+)\s*XP?/i);
    const iconMatch = outputPrompt.match(/Icon:\s*(.+)/i);

    const newQuest = {
      title: titleMatch ? titleMatch[1].trim() : "",
      backstory: backstoryMatch ? backstoryMatch[1].trim() : "",
      objective: objectiveMatch ? objectiveMatch[1].trim() : "",
      reward: rewardMatch ? parseInt(rewardMatch[1]) : 0,
      icon: iconMatch ? iconMatch[1].trim() : "📜",
      status: "Yet to Embark"
    };

    if (!newQuest.title || !newQuest.objective || !newQuest.reward || !newQuest.backstory) {
      alert("Invalid quest format.");
      return;
    }

    onAddQuest(newQuest);
    setNewTask('');
    setOutputPrompt('');
    alert("Quest added successfully!");
  };

  return (
    <div className="add-quest active">
      <h2>➕ Add New Quest</h2>

      <div>
        <form id="addQuestForm">
          <label htmlFor="newtask">What quests must be completed today?</label><br />
          <textarea 
            id="newtask" 
            name="newtask" 
            value={newTask}
            onChange={handleTaskChange}
          />
        </form>
      </div>

      <div className="output-prompt">
        <button type="button" id="ai-button" onClick={callOllama}>🧙 Generate with AI</button>
        <textarea 
          id="outputPrompt" 
          name="outputPrompt" 
          placeholder="AI-generated quest will appear here..." 
          required
          value={outputPrompt}
          readOnly
          style={{ borderColor: formatError ? 'red' : '#ccc' }}
        />
        {formatError && (
          <p id="formatError" style={{ color: 'red' }}>
            Invalid format! Please use the exact Title/Backstory/Objective/Reward format.
          </p>
        )}
      </div>

      <div className="submit-section">
        <button 
          className="submitNewQuest-btn" 
          id="submitNewQuest-btn" 
          type="button" 
          onClick={addQuest}
          disabled={formatError}
        >
          Add Task
        </button>
        <button className="close" onClick={onClose}>❌</button>
      </div>
    </div>
  );
}
