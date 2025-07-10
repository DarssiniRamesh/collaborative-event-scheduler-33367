import React from 'react';

/**
 * EventPopover
 * - Shows event details. Can be expanded to add actions (edit, delete, invite, etc.)
 * - Appears anchored to the event card.
 */
// PUBLIC_INTERFACE
export default function EventPopover({ show, event, onClose, onEdit }) {
  if (!show || !event) return null;
  // For MVP, simply position in center; future: anchor positioning
  return (
    <div className="popover-overlay" onClick={onClose}>
      <div className="popover-content" onClick={e => e.stopPropagation()}>
        <h4>{event.title}</h4>
        <p>{event.description}</p>
        <div>
          <strong>Start:</strong> {event.start && new Date(event.start).toLocaleString()}<br/>
          <strong>End:</strong> {event.end && new Date(event.end).toLocaleString()}
        </div>
        <div>
          <strong>Participants: </strong>
          {event.participants && event.participants.map(email =>
            <span className="event-avatar" key={email}>{email[0]}</span>
          )}
        </div>
        <div className="popover-actions">
          {onEdit && <button onClick={onEdit}>Edit</button>}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
