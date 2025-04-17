// src/components/Transcriptions/TranscriptionItem.jsx
import React from "react";
import highlightText from "../../utils/highlightText";
import styles from "./Transcriptions.module.css";

export default function TranscriptionItem({ record, keyword }) {
  const raw = record.translation || record.transcription || "";
  const html = highlightText(raw, keyword);
  let timeLabel = record.record_time;
  try {
    timeLabel = new Date(record.record_time).toLocaleString();
  } catch (_) {}
  return (
    <li className={styles.item}>
      <div className={styles.time}>{timeLabel}</div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </li>
  );
}
