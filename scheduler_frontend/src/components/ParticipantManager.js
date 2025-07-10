import React, { useState } from 'react';

/**
 * ParticipantManager
 * - Lets users add (autocomplete), remove, and list email participants
 * - Simulates autocomplete - actual app would pull from backend.
 */
// PUBLIC_INTERFACE
export default function ParticipantManager({ value, onChange }) {
  const [input, setInput] = useState('');
  const [list, setList] = useState(value || []);

  // Update list when parent changes
  React.useEffect(() => setList(value || []), [value]);

  function handleAdd() {
    const v = input.trim();
    if (v && !list.includes(v)) {
      const newList = [...list, v];
      setList(newList);
      setInput('');
      onChange(newList);
    }
  }
  function handleRemove(email) {
    const newList = list.filter(x => x !== email);
    setList(newList);
    onChange(newList);
  }

  return (
    <div className="participants">
      <div className="participants-list">
        {list.map(email => (
          <span className="participant-pill" key={email}>
            {email}
            <button type="button" className="pill-remove" onClick={() => handleRemove(email)}>×</button>
          </span>
        ))}
      </div>
      <div className="participants-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add email..."
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button type="button" onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
}
