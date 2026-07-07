import React from "react";

export default function LoadingIndicator({ message = "Cargando...", inline = false }) {
  return (
    <div className={`spinner${inline ? " spinner--inline" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <p>{message}</p>
    </div>
  );
}
