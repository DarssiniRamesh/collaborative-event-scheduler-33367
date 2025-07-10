import React, { useState, useEffect } from 'react';
import CalendarToolbar from './CalendarToolbar';
import EventDialog from './EventDialog';
import EventPopover from './EventPopover';
import { useAuth } from '../App';
import { useWebSocket } from './WebSocketProvider';
import './Calendar.css';

/**
 * Helper functions for calendar time calculations
 */
// PUBLIC_INTERFACE
export function getMonthMatrix(year, month) {
  // Returns 2D array of Date objects for the 6 weeks of the displayed month
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfGrid = new Date(year, month, 1 - firstDayOfMonth.getDay());
  let matrix = [];
  for (let week = 0; week < 6; week++) {
    let weekArr = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(firstDayOfGrid);
      date.setDate(firstDayOfGrid.getDate() + week * 7 + day);
      weekArr.push(date);
    }
    matrix.push(weekArr);
  }
  return matrix;
}

/**
 * Calendar Component
 * - Main UI: handles month/week/day views and event interaction
 * - Responsive, fetches events for visible range and supports CRUD via modals
 */
// PUBLIC_INTERFACE
export default function Calendar({ token }) {
  const { user } = useAuth();
  // View modes: month, week, day
  const [view, setView] = useState('month');
  const today = new Date();
  const [cursorDate, setCursorDate] = useState(today);
  const [events, setEvents] = useState([]);       // {id, title, description, start, end, participants}
  const [loading, setLoading] = useState(false);
  const [dialogProps, setDialogProps] = useState({ open: false, event: null });
  const [popoverProps, setPopoverProps] = useState({ show: false, event: null, anchor: null });

  // Always call hooks & helpers unconditionally (fix ESLint/react-hooks error)
  const wsCtx = useWebSocket ? useWebSocket() : {};
  const subscribeEventUpdates = wsCtx.subscribeEventUpdates || (() => null);

  // Fetch events for visible range
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // Calculate start/end based on view
        let rangeStart, rangeEnd;
        if (view === 'month') {
          rangeStart = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
          rangeEnd = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1);
        } else if (view === 'week') {
          const start = new Date(cursorDate);
          start.setDate(start.getDate() - start.getDay());
          rangeStart = start;
          rangeEnd = new Date(start);
          rangeEnd.setDate(rangeEnd.getDate() + 7);
        } else {
          rangeStart = new Date(cursorDate);
          rangeEnd = new Date(cursorDate);
          rangeEnd.setDate(rangeEnd.getDate() + 1);
        }
        const res = await fetch(
          `/api/events?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    if (user && token) fetchEvents();
  }, [user, token, view, cursorDate]);

  // Subscribe to WebSocket real-time updates
  useEffect(() => {
    if (!subscribeEventUpdates) return;
    // Re-fetch events for any event change from server
    const unsub = subscribeEventUpdates((type, payload) => {
      if (
        type === "event_added" ||
        type === "event_updated" ||
        type === "event_deleted" ||
        type === "participant_changed"
      ) {
        // Slight timeout for backend consistency
        setTimeout(() => setCursorDate((d) => new Date(d)), 250);
      }
    });
    return () => { if (unsub) unsub(); };
  }, [subscribeEventUpdates]);

  // CRUD operations
  async function handleCreate(eventData) {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        setDialogProps({ open: false, event: null });
        // Refetch events
        setTimeout(() => setCursorDate(new Date(cursorDate)), 200);
      }
    } catch (e) {}
  }
  async function handleEdit(eventData) {
    try {
      const res = await fetch(`/api/events/${eventData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        setDialogProps({ open: false, event: null });
        setTimeout(() => setCursorDate(new Date(cursorDate)), 200);
      }
    } catch (e) {}
  }
  async function handleDelete(eventId) {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDialogProps({ open: false, event: null });
        setTimeout(() => setCursorDate(new Date(cursorDate)), 200);
      }
    } catch (e) {}
  }

  // Handle click on empty day/timeslot
  function handleSlotClick(date) {
    setDialogProps({
      open: true,
      event: { start: date.toISOString(), end: date.toISOString(), participants: [user?.email] }
    });
  }
  // Handle click on event card
  function handleEventClick(event, anchor) {
    setPopoverProps({ show: true, event, anchor });
  }
  function handleClosePopover() {
    setPopoverProps({ show: false, event: null, anchor: null });
  }

  // Render calendar grid based on view
  function renderGrid() {
    if (view === 'month') {
      const ymatrix = getMonthMatrix(cursorDate.getFullYear(), cursorDate.getMonth());
      return (
        <div className="calendar-grid month">
          <div className="calendar-row header">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div className="calendar-cell header" key={d}>{d}</div>
            ))}
          </div>
          {ymatrix.map((week, i) => (
            <div className="calendar-row" key={i}>
              {week.map((date, j) => {
                const evts = events.filter(ev => {
                  // crude overlap check for all-day events
                  const evStart = new Date(ev.start), evEnd = new Date(ev.end || ev.start);
                  return (
                    evStart <= date && evEnd >= date &&
                    (evStart.getDate() === date.getDate() || evEnd.getDate() === date.getDate())
                  );
                });
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={j}
                    className={`calendar-cell day${isToday ? ' today' : ''}`}
                    onClick={e => { e.stopPropagation(); handleSlotClick(date); }}
                  >
                    <span className="cell-date">{date.getDate()}</span>
                    <div className="cell-events">
                      {evts.slice(0, 3).map(ev => (
                        <EventCard
                          key={ev.id}
                          event={ev}
                          onClick={e => { e.stopPropagation(); handleEventClick(ev, e.target); }}
                        />
                      ))}
                      {evts.length > 3 && <span className="event-more">+{evts.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    // Future: week/day views
    return (
      <div className="calendar-grid week">
        <div style={{padding:24}}>Week/Day views not implemented in demo.</div>
      </div>
    );
  }

  return (
    <div className="calendar-main">
      <CalendarToolbar
        view={view}
        setView={setView}
        cursorDate={cursorDate}
        setCursorDate={setCursorDate}
        onCreate={() => setDialogProps({ open: true, event: { participants: [user?.email] } })}
      />
      {loading && <div className="calendar-loading">Loading events...</div>}
      {renderGrid()}
      <EventDialog
        open={dialogProps.open}
        event={dialogProps.event}
        onClose={() => setDialogProps({ open: false, event: null })}
        onSubmit={dialogProps.event && dialogProps.event.id ? handleEdit : handleCreate}
        onDelete={dialogProps.event && dialogProps.event.id ? handleDelete : undefined}
      />
      <EventPopover
        show={popoverProps.show}
        event={popoverProps.event}
        anchor={popoverProps.anchor}
        onClose={handleClosePopover}
        onEdit={() => {
          setDialogProps({ open: true, event: popoverProps.event });
          handleClosePopover();
        }}
      />
    </div>
  );
}

function EventCard({ event, onClick }) {
  // Simple colored block for event
  return (
    <div className="event-card" tabIndex={0} onClick={onClick}>
      <strong>{event.title}</strong>
      <div className="event-participants">
        {event.participants ? event.participants.slice(0,3).map(p => (
          <span className="event-avatar" key={p}>{p[0]}</span>
        )) : null}
      </div>
    </div>
  );
}
