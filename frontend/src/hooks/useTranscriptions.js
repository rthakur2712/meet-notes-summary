import { useEffect, useRef, useState } from "react";
import { fetchTranscriptions as _fetch } from "../services/api";
export default function useTranscriptions(isRecording){
    const [data,setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const pollRef = useRef();

    const fetchAll = async()=>{
        setLoading(true);
        try{
            const json = await _fetch();
            setData(json.transcriptions);
        }
        catch(e){
            console.error(e);
        }
        finally{
            setLoading(false);
        }
    };
    
    useEffect(()=>{
        if(isRecording){
            pollRef.current = setInterval(fetchAll, 5000);
        } else{
            clearInterval(pollRef.current);
            fetchAll();
        }
        return ()=>clearInterval(pollRef.current);
    },[isRecording]);

    return {data, loading, reload: fetchAll};
    
}