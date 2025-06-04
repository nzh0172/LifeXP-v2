import { useState } from 'react';
import '../styles/AddQuest.css';

export default function AddQuest({ onAddQuest, onClose }) {
  const [newTask, setNewTask] = useState('');
  const [outputPrompt, setOutputPrompt] = useState(''); // Print output prompt on textbox
  const [formatError, setFormatError] = useState(false); // Check for format
  const [isGenerating, setIsGenerating] = useState(false); // Loading state

  const callOllama = async () => {
    if (!newTask.trim()) {
      alert("Please enter a task first!");
      return;
    }

    setIsGenerating(true); // Start loading

    try {
      const response = await fetch("http://localhost:5050/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', //added here
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
    } finally {
      setIsGenerating(false); // End loading
    }
  };

  const handleTaskChange = (e) => {
    setNewTask(e.target.value);
  };

  const addQuest = async () => {
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

    // Now POST to /quests so the server writes to the database
    try {
      const resp = await fetch("http://localhost:5050/quests", {
        method: "POST",
        credentials: "include",            // <<– must include so Flask sees session['user_id']
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuest)
      });
      if (!resp.ok) throw new Error("Failed to save quest");
      const saved = await resp.json();    // assuming your /quests POST returns new_q.serialize()
      // Now update React state with the truly saved quest:
      onAddQuest(saved);
      setNewTask("");
      setOutputPrompt("");
      alert("Quest saved successfully!");
    } catch (err) {
      console.error("Error saving quest:", err);
      alert("Could not save quest to the database.");
    }
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
            disabled={isGenerating} // Disable text area when generating
          />
        </form>
      </div>

      <div className="output-prompt">

        <textarea 
          id="outputPrompt" 
          name="outputPrompt" 
          placeholder={isGenerating ? "AI is generating your quest...": "AI-generated quest will appear here..." }
          required
          value={outputPrompt}
          readOnly
          style={{ borderColor: formatError ? 'red' : '#ccc' }}
          disabled={isGenerating}
        />
        {formatError && (
          <p id="formatError" style={{ color: 'red' }}>
            Invalid format! Please use the exact Title/Backstory/Objective/Reward format.
          </p>
        )}
      </div>

      <div className="submit-section">
      <button 
          type="button" 
          id="ai-button"
          disabled={isGenerating}
          onClick={callOllama}> {isGenerating ? 'Generating...' : '🧙 Generate with AI' }</button>
        <button 
          className="submitNewQuest-btn" 
          id="submitNewQuest-btn" 
          type="button" 
          onClick={addQuest}
          disabled={formatError||isGenerating}
        >
          Add Task
        </button>
        <button className="close" onClick={onClose} disabled={isGenerating}>❌</button>
      </div>
    </div>
  );
}
