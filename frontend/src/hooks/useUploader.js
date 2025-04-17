// src/hooks/useUploader.js
import { useState } from "react";
import { uploadAudio as apiUpload } from "../services/api";

export default function useUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) throw new Error("No file selected");
    setUploading(true);
    try {
      const res = await apiUpload(file);
      return res;      // contains { summary?, ... }
    } finally {
      setUploading(false);
    }
  };

  return { file, setFile, uploading, upload };
}
