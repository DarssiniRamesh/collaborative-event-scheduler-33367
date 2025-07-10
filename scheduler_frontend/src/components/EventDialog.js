import React, { useState, useEffect } from 'react';
import ParticipantManager from './ParticipantManager';

/**
 * EventDialog Modal
 * - Used for creating or editing an event (title, desc, time, participants)
 * - Can delete event if editing
 */
// PUBLIC_INTERFACE
export default function EventDialog({ open, event, onClose, onSubmit, onDelete }) {
  const isEdit = Boolean(event && event.id);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    participants: [],
  });

  useEffect(() => {
    if (event && open) setForm({
      title: event.title || '',
      description: event.description || '',
      start: event.start ? event.start.slice(0, 16) : '',
      end: event.end ? event.end.slice(0, 16) : '',
      participants: event.participants || [],
      id: event.id,
    });
    else setForm({ title: '', description: '', start: '', end: '', participants: [] });
  }, [event, open]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleParticipantChange(newList) {
    setForm({ ...form, participants: newList });
  }
  function onOk() {
    if (!form.title || !form.start || !form.participants.length) return;
    onSubmit({ ...form, start: new Date(form.start).toISOString(), end: new Date(form.end).toISOString() });
  }
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit' : 'Create'} Event</h3>
        <div className="modal-form">
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>
          <label>
            Start
            <input type="datetime-local" name="start" value={form.start} onChange={handleChange} />
          </label>
          <label>
            End
            <input type="datetime-local" name="end" value={form.end} onChange={handleChange} />
          </label>
          <label>
            Participants
            <ParticipantManager value={form.participants} onChange={handleParticipantChange} />
          </label>
        </div>
        <div className="modal-actions">
          <button onClick={onOk}>{isEdit ? 'Save' : 'Create'}</button>
          {isEdit && <button onClick={() => onDelete(form.id)} style={{color:'red'}}>Delete</button>}
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
