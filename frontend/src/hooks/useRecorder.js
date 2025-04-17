// src/hooks/useRecorder.js
import { useState } from "react";
import { startRecording as apiStart, stopRecording as apiStop } from "../services/api";

export default function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);

  const start = async () => {
    // fire off the API call, then flip the flag
    await apiStart();
    setIsRecording(true);
  };

  const stop = async () => {
    // stop on the backend, flip flag, return summary
    const res = await apiStop();
    setIsRecording(false);
    return res.summary || "";
  };

  return { isRecording, start, stop };
}
