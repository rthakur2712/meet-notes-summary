// src/components/RecordingControls/RecordingControls.jsx
import React from "react";
import styles from "./RecordingControls.module.css";

export default function RecordingControls({ onStart, onStop }) {
  return (
    <div className={styles.wrapper}>
      <button onClick={onStart}>Start Recording</button>
      <button onClick={onStop}>Stop Recording</button>
    </div>
  );
}
