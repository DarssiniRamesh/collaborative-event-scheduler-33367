import React from 'react';

/**
 * CalendarToolbar Component
 * - Displays navigation (month, week back/forward/today), current period, and view mode selector
 * - Calls props for navigation and view changes
 */
// PUBLIC_INTERFACE
export default function CalendarToolbar({
  view, setView, cursorDate, setCursorDate, onCreate
}) {
  function toMonthString(dt) {
    return `${dt.toLocaleString('default', { month: 'long' })} ${dt.getFullYear()}`;
  }
  function goToday() { setCursorDate(new Date()); }
  function goPrev() {
    const d = new Date(cursorDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursorDate(d);
  }
  function goNext() {
    const d = new Date(cursorDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursorDate(d);
  }

  return (
    <div className="calendar-toolbar">
      <button onClick={goPrev}>&lt;</button>
      <button onClick={goToday}>Today</button>
      <button onClick={goNext}>&gt;</button>
      <span className="calendar-toolbar-label">{toMonthString(cursorDate)}</span>
      <select value={view} onChange={e => setView(e.target.value)}>
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
      </select>
      <button className="calendar-toolbar-create" onClick={onCreate}>+ Event</button>
    </div>
  );
}
