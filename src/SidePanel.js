import React, { useState } from 'react';
import './SidePanel.css'; 

const SidePanel = ({ pastPrompts, setSentence }) => {
  // Sample guidelines for prompt engineering
  const guidelines = [
    "Be specific: Clearly describe what you want to generate.",
    "Use positive and negative prompts to guide the model.",
    "Include context if relevant to get more accurate results.",
    "Avoid overly complex sentences; simplicity often yields better results.",
    "Experiment with different wording to see how it affects the output."
  ];

  const [showGuidelines, setShowGuidelines] = useState(false);

  return (
    <div className="side-panel">
      <h2>Past Prompts</h2>
      <ul className="prompt-list">
        {pastPrompts.map((prompt, index) => (
          <li key={index} onClick={() => setSentence(prompt)}>
            {prompt}
          </li>
        ))}
      </ul>

      <button className="guidelines-toggle" onClick={() => setShowGuidelines(!showGuidelines)}>
        {showGuidelines ? "Hide Guidelines" : "Show Guidelines"}
      </button>

      {showGuidelines && (
        <div className="guidelines">
          <h3>Prompt Engineering Guidelines</h3>
          <ul>
            {guidelines.map((guideline, index) => (
              <li key={index}>{guideline}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SidePanel;

