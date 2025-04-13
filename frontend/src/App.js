// App.js
import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import ReactMarkdown from "react-markdown";

const backendUrl = "http://127.0.0.1:8000"; // Adjust if needed

function App() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [summary, setSummary] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [file, setFile] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const pollingRef = useRef(null);

  // Function to fetch transcriptions from the backend
  const fetchTranscriptions = async () => {
    try {
      const response = await fetch(`${backendUrl}/transcriptions`);
      if (response.ok) {
        let data = await response.json();
        // Adjust according to the key your endpoint returns, e.g., data.transcriptions or data.records.
        let a = data.transcriptions || data.records;
        setTranscriptions(a);
      } else {
        console.error("Failed to fetch transcriptions");
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
    }
  };

  // Start polling every 2 seconds if recording is active
  useEffect(() => {
    if (isRecording) {
      pollingRef.current = setInterval(fetchTranscriptions, 2000);
    } else {
      clearInterval(pollingRef.current);
    }
    // Clear polling on unmount
    return () => clearInterval(pollingRef.current);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const res = await fetch(`${backendUrl}/start-recording`);
      const data = await res.json();
      console.log(data.message);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const res = await fetch(`${backendUrl}/stop-recording`);
      const data = await res.json();
      console.log(data.message);
      setIsRecording(false);
      // Stop polling and update the summary
      clearInterval(pollingRef.current);
      if (data.summary) {
        setSummary(data.summary);
      }
      // Optionally, refresh the transcription list one final time
      fetchTranscriptions();
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select an audio file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${backendUrl}/upload-audio`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log(data);
      // Refresh the list after file upload
      fetchTranscriptions();
      // Optionally, update the summary if your endpoint returns it
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Helper function that highlights the search keyword in the given text
  const highlightText = (text, keyword) => {
    if (!keyword.trim()) {
      return text;
    }
    // Create a regular expression for the keyword, escaping special characters if needed.
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedKeyword})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <div style={styles.container}>
      <h1>Audio Transcription & Summary</h1>
      <div style={styles.controls}>
        <button style={styles.button} onClick={handleStartRecording}>
          Start Recording
        </button>
        <button style={styles.button} onClick={handleStopRecording}>
          Stop Recording
        </button>
        <input type="file" onChange={handleFileChange} />
        <button style={styles.button} onClick={handleFileUpload}>
          Upload File
        </button>
      </div>
      {/* Search Input */}
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
          <ul>
            {transcriptions.length > 0
              ? transcriptions.map((record) => {
                  // Using highlightText on the transcription text
                  const originalText = record.translation || "";
                  const highlightedText = highlightText(originalText, searchKeyword);
                  return (
                    <div key={record.id} style={styles.record}>
                      <li>
                        {/* Rendering highlighted text as HTML */}
                        <div
                          style={{ whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{ __html: highlightedText }}
                        />
                      </li>
                    </div>
                  );
                })
              : null}
          </ul>
        </div>
      </div>
      <div style={styles.section}>
        <h2>Summary</h2>
        <div style={{ ...styles.box, height: "500px", backgroundColor: "#f0f0f0" }} id="summaryBox">
          {summary ? <Markdown>{summary}</Markdown> : <p>Summary will appear here when recording stops.</p>}
        </div>
      </div>
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
    padding: "10px 20px",
    fontSize: "16px",
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
    height: "200px",
    overflowY: "auto",
  },
  record: {
    marginBottom: "10px",
  },
};

export default App;
