// src/components/FileUploader/FileUploader.jsx
import React from "react";
import { useDropzone } from "react-dropzone";
import styles from "./FileUploader.module.css";

export default function FileUploader({ file, setFile, onUpload }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: fs => fs.length && setFile(fs[0]),
    accept: "audio/*",
    multiple: false,
  });

  return (
    <div>
      <div {...getRootProps()} className={styles.dropzone}>
        <input {...getInputProps()} />
        {file
          ? <p>{file.name}</p>
          : isDragActive
            ? <p>Drop audio here…</p>
            : <p>Drag & drop or click to select audio</p>}
      </div>
      <button onClick={onUpload}>Upload File</button>
    </div>
  );
}
