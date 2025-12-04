import React, { useState, useRef } from 'react';
import { RecorderStatus } from '../types';
import { MicIcon } from './Icons';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  mode?: 'small' | 'large';
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, mode = 'large' }) => {
  const [status, setStatus] = useState<RecorderStatus>(RecorderStatus.IDLE);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        chunksRef.current = [];
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus(RecorderStatus.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === RecorderStatus.RECORDING) {
      mediaRecorderRef.current.stop();
      setStatus(RecorderStatus.STOPPED);
    }
  };

  if (mode === 'small') {
    return (
      <button
        onClick={status === RecorderStatus.RECORDING ? stopRecording : startRecording}
        className={`p-2 rounded-full transition-colors ${
          status === RecorderStatus.RECORDING
            ? 'bg-red-500 text-white animate-pulse'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
        title={status === RecorderStatus.RECORDING ? "Stop Recording" : "Record Voice Message"}
      >
        <MicIcon className="w-5 h-5" />
      </button>
    );
  }

  // Large mode for Signup
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
        status === RecorderStatus.RECORDING ? 'bg-red-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'
      }`} onClick={status === RecorderStatus.RECORDING ? stopRecording : startRecording}>
        <MicIcon className="w-10 h-10 text-white" />
      </div>
      <p className="text-gray-600 font-medium">
        {status === RecorderStatus.RECORDING ? 'Recording... Tap to stop' : status === RecorderStatus.STOPPED ? 'Recorded! Re-record?' : 'Tap to Record'}
      </p>
    </div>
  );
};

export default VoiceRecorder;
