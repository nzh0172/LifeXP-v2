import { useState } from 'react';
import '../styles/AddQuest.css';

export default function AddQuest({ onAddQuest, onClose }) {
  const [newTask, setNewTask] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [formatError, setFormatError] = useState(false);
  const [hiddenCopyText, setHiddenCopyText] = useState('');

  // Update hidden copy text when task changes
  const handleTaskChange = (e) => {
    const value = e.target.value;
    setNewTask(value);
    
    // Generate the prompt text
    const prompt = 
      "You are to turn a given task into a quest with short backstory consists of 1 short paragraph with 3 sentences, 50 words max. If the task contains a name or a deadline, you must include it. " +
      "The quest must have the user's involvement using pronoun 'You', not a third party. Make it under this format 'Backstory:' " +
      "For each task, give a cool epic medieval quest name under this format (make it under 20 characters), Title: X. " +
      "Rephrase the original task under this format, Objective: X, do not add any additional info such as time or deadline or other character unless mentioned in the task. " +
      "Do not put any symbols such as double ** in title, backstory, objective, reward and icon. " +
      "Make a suitable icon for the quest under this format, Icon: X." +
      "For each task, give an amount of XP that is appropriate for the level of difficulty of the task. " +
      "The coins must not be zero or negative. Give only XP, no other comments needed. Make it under this format 'Reward: X XP'. " +
      "The appearance order must be: first, Title, then Backstory, Objective, Reward and Icon.\n\n" +
      value;
    
    setHiddenCopyText(prompt);
  };

  // Handle output prompt validation
  const handleOutputPromptChange = (e) => {
    const text = e.target.value;
    setOutputPrompt(text);
    
    // Validate the format
    const isValid = /^Title:\s*(.+)\nBackstory:\s*((?:.|\n)*?)\nObjective:\s*(.+)\nReward:\s*(\d+)\s*XP\s*(?:\nIcon:\s*(.+))?$/i.test(text.trim());
    setFormatError(!isValid);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hiddenCopyText);
    alert("Copied to clipboard!");
  };

  // Add quest handler
  const addQuest = () => {
    if (formatError) {
      alert("Invalid quest format.");
      return;
    }

    // Parse the quest text
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

      <div className="copy-prompt">
        {/* Hidden input holding the full text */}
        <input type="hidden" id="hiddenCopyText" value={hiddenCopyText} />
        {/* Visible input with placeholder (not the real text) */}
        <input 
          type="text" 
          id="copyBox" 
          placeholder="Click to copy prompt" 
          readOnly 
          onClick={copyToClipboard} 
        />
      </div>

      <div className="output-prompt">
        <form id="outputPromptForm">
          <textarea 
            id="outputPrompt" 
            name="outputPrompt" 
            placeholder="Paste ChatGPT output and click Add Task" 
            required
            value={outputPrompt}
            onChange={handleOutputPromptChange}
            style={{ borderColor: formatError ? 'red' : '#ccc' }}
          />
          {formatError && (
            <p id="formatError" style={{ color: 'red' }}>
              Invalid format! Please use the exact Title/Backstory/Objective/Reward format.
            </p>
          )}
        </form>
      </div>

      <div className="submit-section">
        <button 
          className="submitNewQuest-btn" 
          id="submitNewQuest-btn" 
          type="submit" 
          onClick={addQuest}
          disabled={formatError}
        >
          Add Task
        </button>
        <button className="close" onClick={onClose}>❌</button>
      </div>
    </div>
  );
};