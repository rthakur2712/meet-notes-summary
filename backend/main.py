from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import soundcard as sc
import numpy as np
import wave
import whisper
import queue
import time
import os
from datetime import datetime
import tempfile
import threading
import logging
import sys
import os
import google.generativeai as genai
from dotenv import load_dotenv


# Loading the contents for the Gemini-API
load_dotenv()
client = genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
free_model_name = "gemini-2.0-flash"  # Or "gemma-7b"
gemini_model = genai.GenerativeModel(free_model_name)

    

#Marking the global start-time
session_start_time = None

# --- SQLAlchemy and SQLite Setup ---
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./transcriptions.db"
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # SQLite specific flag
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Transcription(Base):
    __tablename__ = "transcriptions"
    id = Column(Integer, primary_key=True, index=True)
    record_time = Column(DateTime)
    language = Column(String(10))
    transcription = Column(Text)
    translation = Column(Text)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- Logging Setup ---
logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

# ----- SETTINGS -----
samplerate = 48000
duration = 5
num_frames = samplerate * duration
audio_queue = queue.Queue()
model = whisper.load_model("small")

# Shared control variables
recording_event = threading.Event()
recording_thread = None

# ----- FASTAPI APP -----
app = FastAPI(title="Audio Transcription and Translation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- AUDIO DEVICE SETUP -----
def get_loopback_device():
    for device in sc.all_microphones():
        if "Stereo Mix" in device.name or "Loopback" in device.name:
            print(f"Using device: {device.name}")
            return device
    return None

loopback_mic = get_loopback_device()
if loopback_mic is None:
    raise Exception("No loopback device found. Please enable or install one.")

# ----- AUDIO & TRANSCRIPTION UTILITIES -----
def record_audio_clip(device):
    with device.recorder(samplerate=samplerate) as mic:
        audio_data = mic.record(numframes=num_frames)
    max_val = np.max(np.abs(audio_data))
    audio_int16 = np.int16(audio_data / max_val * 32767) if max_val != 0 else np.int16(audio_data)
    return audio_int16, datetime.now()

def write_audio_to_tempfile(audio_data):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        filename = tmp_file.name
    with wave.open(filename, "wb") as wf:
        n_channels = 1 if audio_data.ndim == 1 else audio_data.shape[1]
        wf.setnchannels(n_channels)
        wf.setsampwidth(2)
        wf.setframerate(samplerate)
        wf.writeframes(audio_data.tobytes())
    return filename

def transcribe_and_translate_return(filename, record_time):
    # Transcribe the audio file
    result = model.transcribe(filename)
    transcription = result["text"].strip()
    lang = result.get("language", "unknown")
    if lang != "en":
        # If the detected language is not English, perform translation
        translate_result = model.transcribe(filename, task="translate")
        translation = translate_result["text"].strip()
    else:
        translation = transcription

    # Remove temporary audio file
    os.remove(filename)

    # Save transcription in the database
    db = SessionLocal()
    try:
        record = Transcription(
            record_time=record_time,
            language=lang,
            transcription=transcription,
            translation=translation
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"DB error: {e}")
    finally:
        db.close()

    output_text = f"""
    ==== Transcription Log ====
    Recorded at: {record_time.strftime('%Y-%m-%d %H:%M:%S')}
    Detected Language: {lang}
    Transcription: {transcription}
    Translation: {translation}
    ==========================\n\n
    """
    print(output_text)
    return output_text

def transcription_worker():
    while True:
        item = audio_queue.get()
        if item is None:
            break
        try:
            audio_data = item["audio_data"]
            record_time = item["record_time"]
            temp_filename = write_audio_to_tempfile(audio_data)
            transcribe_and_translate_return(temp_filename, record_time)
        finally:
            audio_queue.task_done()

# Start the worker at startup
threading.Thread(target=transcription_worker, daemon=True).start()

# ----- BACKGROUND RECORDING LOOP -----
def background_recorder():
    while recording_event.is_set():
        audio_data, record_time = record_audio_clip(loopback_mic)
        audio_queue.put({"audio_data": audio_data, "record_time": record_time})
        time.sleep(0.1)  # Slight delay to yield

# ----- SUMMARIZATION UTILITY -----
def summarize_transcriptions():

    db = SessionLocal()
    global session_start_time
    try:
        records = db.query(Transcription).filter(Transcription.record_time>=session_start_time).order_by(Transcription.record_time).all()
        full_text = " ".join([record.transcription for record in records])
    finally:
        db.close()
    # Simple summary: if text is long, return the first 200 characters
    # full_text is the text, we have to summarize it using the GEMINI_API_KEY
    print("inside the summarize function full text: {full_text}\n")
    print(full_text)
    prompt = "Summarize this text with proper points and structured way highlighting important details in 200 words"
    try:
        response = gemini_model.generate_content([prompt, full_text])
        print(f"outside the model, {response.text}")
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return "Error during summarization."

# ----- API ROUTES -----

@app.get("/start-recording")
def start_recording():
    global recording_thread, session_start_time
    if recording_event.is_set():
        return {"message": "Recording already in progress."}
    session_start_time = datetime.now()
    recording_event.set()
    recording_thread = threading.Thread(target=background_recorder, daemon=True)
    recording_thread.start()
    return {"message": "Continuous recording started."}

@app.get("/stop-recording")
def stop_recording():
    if not recording_event.is_set():
        return {"message": "Recording is not currently active."}

    recording_event.clear()
    # Allow any remaining audio to be processed
    audio_queue.join()

    # When recording stops, summarize all the transcriptions from the database
    summary = summarize_transcriptions()
    return {
        "message": "Continuous recording stopped.",
        "summary": summary
    }

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    global session_start_time
    try:
        contents = await file.read()
        session_start_time = datetime.now()
        temp_filename = f"temp_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        with open(temp_filename, "wb") as f:
            f.write(contents)
        record_time = datetime.now()
        result = transcribe_and_translate_return(temp_filename, record_time)
        summary = summarize_transcriptions()
        return {"message": "Upload processed", "log": result,"summary":summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transcriptions")
def get_transcriptions():
    """
    Endpoint for the front-end to poll for transcription updates.
    Returns all transcriptions sorted by record_time.
    """
    db = SessionLocal()
    try:
        if session_start_time:
            records = db.query(Transcription).filter(Transcription.record_time>=session_start_time).order_by(Transcription.record_time).all()
        else:
            records = db.query(Transcription).order_by(Transcription.record_time).all()
        transcriptions_list = [
            {
                "id": record.id,
                "record_time": record.record_time.strftime('%Y-%m-%d %H:%M:%S'),
                "language": record.language,
                "transcription": record.transcription,
                "translation": record.translation
            }
            for record in records
        ]
    finally:
        db.close()
    return {"transcriptions": transcriptions_list}



# Assuming you already have your engine created, e.g.:
# DATABASE_URL = "sqlite:///./transcriptions.db"
# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


