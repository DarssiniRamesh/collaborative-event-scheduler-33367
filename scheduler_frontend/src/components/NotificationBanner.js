import React from "react";

/**
 * NotificationBanner
 * - Displays a confirmation, error, or info banner at the top of the screen.
 * Usage: <NotificationBanner message="Your invitation was sent!" type="success" onClose={() => ...} />
 */
// PUBLIC_INTERFACE
const NotificationBanner = ({ message, type = "info", onClose }) => {
  if (!message) return null;

  let color, bg, border;
  if (type === "success") {
    color = "#155724";
    bg = "#d4edda";
    border = "#c3e6cb";
  } else if (type === "error") {
    color = "#842029";
    bg = "#f8d7da";
    border = "#f5c2c7";
  } else if (type === "warn") {
    color = "#856404";
    bg = "#fff3cd";
    border = "#ffeeba";
  } else {
    color = "#065160";
    bg = "#d1ecf1";
    border = "#bee5eb";
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: bg,
        color: color,
        border: `1.5px solid ${border}`,
        borderRadius: 7,
        minWidth: 260,
        maxWidth: 450,
        boxShadow: "0 1px 10px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        padding: "13px 20px",
        fontWeight: "bold",
        transition: "opacity 0.2s",
        pointerEvents: "auto"
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: "transparent",
            border: "none",
            color: color,
            fontWeight: 800,
            fontSize: 18,
            marginLeft: 10,
            cursor: "pointer",
            opacity: 0.6,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default NotificationBanner;
