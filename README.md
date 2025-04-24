![image](https://github.com/user-attachments/assets/cdf5297b-b5b5-44b5-87ed-a7504dbad116)
Here’s a cleaned-up, ready-to-use `README.md`. I’ve fixed code-block delimiters, ensured consistent formatting, and polished a few minor typos:

```markdown
# Audio Transcription & Summarization App

A full-stack application that lets you record or upload audio, transcribe it via OpenAI’s Whisper model, and generate structured summaries using Google’s Gemini API. Transcriptions and summaries are managed by a FastAPI backend and presented through a modern React frontend.

---

## 🚀 Features

- **Record Audio**  
  Capture system audio via a loopback device (e.g., “Stereo Mix” on Windows).

- **Upload Audio**  
  Upload local audio files (`.wav`, `.mp3`, etc.) for transcription.

- **Automatic Transcription**  
  Speech-to-text powered by OpenAI Whisper.

- **Translation**  
  Non-English audio is auto-translated into English before transcription.

- **Session-Scoped History**  
  Only show and summarize transcriptions from your current session.

- **Summarization**  
  Generate a concise, structured summary of the transcription using Google’s Gemini API.

- **Download Summary**  
  Export your summary as a PDF.

- **Search**  
  Full-text search within your current session’s transcripts.

- **Modern Frontend**  
  Built with React for a smooth, responsive UI.

- **Robust Backend**  
  Powered by FastAPI and SQLite for quick development and easy deployment.

---

## 📦 Tech Stack

- **Backend:** FastAPI, SQLite, Uvicorn  
- **Frontend:** React (Create React App)  
- **Transcription:** OpenAI Whisper  
- **Summarization:** Google Gemini API  
- **Languages:** Python 3.8+, Node.js 16+

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/soundcard_testing.git
cd soundcard_testing
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Activate the venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` with your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend server:

```bash
uvicorn main:app --reload
```

The backend will be available at:  
`http://127.0.0.1:8000`

### 3. Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm start
```

The frontend will be available at:  
`http://localhost:3000`

---

## ⚙️ Usage

1. **Start the Backend:**  
   ```bash
   uvicorn main:app --reload
   ```
2. **Start the Frontend:**  
   ```bash
   npm start
   ```
3. **Open the App:**  
   Navigate to `http://localhost:3000` in your browser.
4. **Interact:**  
   - Click **Record** to capture system audio.  
   - Or **Upload** any audio file.  
   - View live transcription (auto-translated if non-English), then generate a summary.  
   - Download the summary PDF or search within your session’s transcripts.

---

## 📄 Requirements

- Python 3.8 or higher  
- Node.js 16 or higher  
- A system audio loopback device (e.g., “Stereo Mix” on Windows)  
- A valid Google Gemini API key  
- Internet access (to download the Whisper model on first run)

---

## 📝 Notes

- **Session-only Data:** Only transcriptions made during the current server run are shown. Restarting or deleting the SQLite file clears history.  
- **Persistence:** The SQLite database file (e.g., `db.sqlite3`) lives in `backend/` and persists between runs unless manually deleted.  
- **Loopback Audio:** Ensure your OS has a loopback/mix device enabled if you want to record system audio.

---

## 🙏 Credits

- [OpenAI Whisper](https://github.com/openai/whisper)  
- [FastAPI](https://fastapi.tiangolo.com/)  
- [React](https://reactjs.org/)  
- [Google Gemini API](https://studio.google.ai/)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute!
```
