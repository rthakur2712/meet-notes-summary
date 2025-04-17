// src/components/Transcriptions/Transcriptions.jsx
import React, { useState } from "react";
import TranscriptionItem from "./TranscriptionItem";
import styles from "./Transcriptions.module.css";

export default function Transcriptions({ items }) {
  const [keyword, setKeyword] = useState("");
  return (
    <section className={styles.wrapper}>
      <h2>Transcriptions</h2>
      <input
        type="text"
        placeholder="Search..."
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
      />
      <ul className={styles.list}>
        {items.map(r => (
          <TranscriptionItem key={r.id} record={r} keyword={keyword} />
        ))}
      </ul>
    </section>
  );
}
