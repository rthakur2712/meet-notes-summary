// src/components/Summary/Summary.jsx
import React from "react";
import Markdown from "react-markdown";
import styles from "./Summary.module.css";

export default function Summary({ text, onDownload }) {
  if (!text) return null;
  return (
    <section className={styles.wrapper}>
      <h2>Summary</h2>
      <div className={styles.box} id="summaryBox">
        <Markdown>{text}</Markdown>
      </div>
      <button onClick={onDownload}>Download PDF</button>
    </section>
  );
}
