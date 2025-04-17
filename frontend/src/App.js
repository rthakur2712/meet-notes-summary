// App.js
import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useDropzone } from "react-dropzone";
import LoadingBar from "react-top-loading-bar";
import Markdown from "react-markdown";

const backendUrl = "http://127.0.0.1:8000"; // Adjust if needed

function App() {
  const [transcriptions, setTranscriptions] = useState(null);
  const [summary, setSummary] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [file, setFile] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const pollingRef = useRef(null);

  // react-top-loading-bar ref
  const loadingBar = useRef(null);

  // react-dropzone setup
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "audio/*",
    multiple: false,
  });

  // Function to fetch transcriptions from the backend
  const fetchTranscriptions = async () => {
    // start loader
    loadingBar.current?.continuousStart();

    try {
      const response = await fetch(`${backendUrl}/transcriptions`);
      if (response.ok) {
        const data = await response.json();
        const records = data.transcriptions || data.records;
        setTranscriptions(records);
      } else {
        console.error("Failed to fetch transcriptions");
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
    } finally {
      // finish loader
      loadingBar.current?.complete();
    }
  };

  // Start polling every 2 seconds if recording is active
  useEffect(() => {
    if (isRecording) {
      pollingRef.current = setInterval(fetchTranscriptions, 5000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [isRecording]);

  const handleStartRecording = async () => {
    loadingBar.current?.continuousStart();
    try {
      const res = await fetch(`${backendUrl}/start-recording`);
      const data = await res.json();
      console.log(data.message);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    } finally {
      loadingBar.current?.complete();
    }
  };

  const handleStopRecording = async () => {
    loadingBar.current?.continuousStart();
    try {
      const res = await fetch(`${backendUrl}/stop-recording`);
      const data = await res.json();
      console.log(data.message);
      setIsRecording(false);
      clearInterval(pollingRef.current);
      if (data.summary) {
        setSummary(data.summary);
      }
      // one final refresh
      await fetchTranscriptions();
    } catch (error) {
      console.error("Error stopping recording:", error);
    } finally {
      loadingBar.current?.complete();
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select or drop an audio file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    loadingBar.current?.continuousStart();
    try {
      const res = await fetch(`${backendUrl}/upload-audio`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log(data);
      // refresh after upload
      await fetchTranscriptions();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      loadingBar.current?.complete();
    }
  };

  // Helper to highlight search keyword
  const highlightText = (text, keyword) => {
    if (!keyword.trim()) return text;
    const esc = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${esc})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  const pdfDownloadHandler = async () => {
    const element = document.getElementById("summaryBox");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("summary.pdf");
  };

  return (
    <div style={styles.container}>
      {/* Top Loading Bar */}
      <LoadingBar color="#29d" ref={loadingBar} />

      <h1>Audio Transcription & Summary</h1>
      <div style={styles.controls}>
        <button style={styles.button} onClick={handleStartRecording}>
          Start Recording
        </button>
        <button style={styles.button} onClick={handleStopRecording}>
          Stop Recording
        </button>
      </div>

      {/* File drop zone */}
      <div {...getRootProps()} style={styles.dropzone}>
        <input {...getInputProps()} />
        {file ? (
          <p>Selected file: {file.name}</p>
        ) : isDragActive ? (
          <p>Drop the audio file here...</p>
        ) : (
          <p>Drag & drop an audio file here, or click to select one</p>
        )}
      </div>
      <button style={styles.button} onClick={handleFileUpload}>
        Upload File
      </button>

      {transcriptions && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search transcriptions..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.section}>
  <h2>Transcriptions</h2>
  <div style={styles.box} id="transcriptionBox">
    <ul style={{ listStyle: "none", padding: 0 }}>
      {transcriptions.map((record) => {
        // pick translation if available, else fallback to raw transcription
        const rawText = record.translation || record.transcription || "";
        const highlighted = highlightText(rawText, searchKeyword);

        // format the timestamp nicely
        let timeLabel = record.record_time;
        try {
          timeLabel = new Date(record.record_time).toLocaleString();
        } catch (e) {
          // keep original if parsing fails
        }

        return (
          <li key={record.id} style={styles.record}>
            {/* timestamp line */}
            <div>{timeLabel}</div>
            {/* transcription text */}
            <div
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </li>
        );
      })}
    </ul>
  </div>
</div>

        </>
      )}

      {summary && (
        <div style={styles.section}>
          <h2>Summary</h2>
          <div
            id="summaryBox"
            style={{
              ...styles.box,
              height: "auto",
              backgroundColor: "#fff",
              overflow: "visible",
            }}
          >
            <Markdown>{summary}</Markdown>
          </div>
          <button style={styles.button} onClick={pdfDownloadHandler}>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  controls: {
    marginBottom: "20px",
  },
  button: {
    marginRight: "10px",
    marginTop: "10px",
    padding: "10px 20px",
    fontSize: "16px",
  },
  dropzone: {
    border: "2px dashed #ccc",
    borderRadius: "4px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "10px",
    width: "80%",
  },
  searchInput: {
    padding: "8px",
    fontSize: "16px",
    width: "300px",
  },
  section: {
    marginTop: "20px",
  },
  box: {
    border: "1px solid #ccc",
    padding: "10px",
    width: "80%",
    overflowY: "auto",
  },
  record: {
    marginBottom: "10px",
  },
};

export default App;
