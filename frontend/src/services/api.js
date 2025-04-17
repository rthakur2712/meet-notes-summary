
// BASE URL
const BASE_URL = "http://127.0.0.1:8000";

export const startRecording = ()=>
    fetch(`${BASE_URL}/start-recording`).then(res=>res.json());

export const stopRecording = ()=>
    fetch(`${BASE_URL}/stop-recording`).then(res=>res.json());

export const fetchTranscriptions = ()=>
    fetch(`${BASE_URL}/transcriptions`).then(res=>res.json());

export const uploadAudio = file=>{
    return fetch(`${BASE_URL}/upload-audio`,{
        method:"POST",
        body: file,
    }).then(res=>res.json());
}