import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// Context for providing WebSocket events and notifications app-wide
const WSContext = createContext();

/**
 * WebSocketProvider wraps the app with a connection to the backend WebSocket.
 * Provides:
 *   - Notification popup queue
 *   - Real-time event update callbacks
 *   - Connection status
 *
 * Usage: Call useWebSocket() from any component.
 *
 * Expects the backend WebSocket endpoint at /ws/events (change as needed).
 */
// PUBLIC_INTERFACE
export function WebSocketProvider({ token, children }) {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  // Add notification popup to queue
  const showNotification = (msg, type = "info") => {
    const id = Math.random().toString(36).substr(2, 6);
    setNotifications((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Broadcast update to listeners (could support event subscriptions if expanded)
  const eventListeners = useRef([]);

  // Register a listener for event updates (CRUD)
  // listener: (type, payload) => void
  // PUBLIC_INTERFACE
  const subscribeEventUpdates = (listener) => {
    eventListeners.current.push(listener);
    return () => {
      eventListeners.current = eventListeners.current.filter((l) => l !== listener);
    };
  };

  useEffect(() => {
    if (!token) return;

    // Construct ws:// or wss:// based on location
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    // Assume backend proxy or CORS allows /ws/events
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/events?token=${encodeURIComponent(token)}`;
    const ws = new window.WebSocket(wsUrl);

    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (msgEvt) => {
      // Expect {type: "event_added"|"event_updated"|"event_deleted"|"participant_changed", payload: {...}}
      try {
        const data = JSON.parse(msgEvt.data);
        const { type, payload } = data;

        if (["event_added", "event_updated", "event_deleted"].includes(type)) {
          // Notify user
          let verb =
            type === "event_added"
              ? "added"
              : type === "event_updated"
              ? "updated"
              : "deleted";
          showNotification(
            `Event "${payload?.title || payload?.id || ""}" ${verb}.`,
            type === "event_deleted" ? "warn" : "info"
          );
        } else if (type === "participant_changed") {
          showNotification(
            `Participation updated for event "${payload?.title || payload?.id || ""}".`,
            "info"
          );
        }
        // Broadcast to listeners
        eventListeners.current.forEach((l) => l(type, payload));
      } catch (e) {
        // Ignore invalid messages
      }
    };

    return () => {
      ws.close();
    };
    // token should be present and immutable for open connection
  }, [token]);

  // Notification popup UI (fixed at top right)
  const Notifications = () => (
    <div style={{
      position: "fixed",
      right: 24,
      top: 24,
      zIndex: 9999,
      minWidth: 220,
      maxWidth: 340,
      pointerEvents: "none",
    }}>
      {notifications.map(({ id, msg, type }) => (
        <div
          key={id}
          style={{
            marginBottom: 10,
            padding: "12px 20px",
            borderRadius: 8,
            background: type === "warn" ? "#ffe1bb" : "#e3f2fd",
            color: type === "warn" ? "#993a00" : "#11577a",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            pointerEvents: "auto",
            transition: "all 0.3s",
          }}
        >
          {msg}
        </div>
      ))}
    </div>
  );

  return (
    <WSContext.Provider value={{
      connected,
      subscribeEventUpdates,
      showNotification, // allow pushing custom
    }}>
      {children}
      <Notifications />
    </WSContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useWebSocket() {
  return useContext(WSContext);
}
