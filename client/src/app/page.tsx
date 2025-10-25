"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import AudioWaveform from "../components/AudioWaveform";

interface Transcript {
  partial: string;
  final: string[];
}

export default function RealtimeTranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<Transcript>({
    partial: "",
    final: [],
  });
  const [status, setStatus] = useState("Idle");
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [canSendAudio, setCanSendAudio] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    socket.on("ready", () => {
      setCanSendAudio(true);
      setStatus("Ready to record");
    });

    return () => {
      socket.off("ready");
    };
  }, []);

  async function startRecording() {
    if (!socketRef.current) return console.log("No socket");
    const socket = socketRef.current;

    try {
      setStatus("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      socket.emit("start"); 

      if (!canSendAudio) {
        setStatus("Waiting for Gladia connection...");
        // Wait for ready
        await new Promise<void>((resolve) => {
          socket.once("ready", () => resolve());
        });
      }

      setIsRecording(true);
      setStatus("Recording...");

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            socket.emit("audio", buffer);
          });
        }
      };

      mediaRecorder.start(250); // send chunks every 250ms
    } catch (err) {
      console.error("Error starting recording", err);
      setStatus("Microphone access denied");
    }
  }

  useEffect(() => {
    // Connect to backend Socket.io (adjust to your backend host)
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setStatus("Connected to server"));
    socket.on("disconnect", () => setStatus("Disconnected"));

    socket.on("gladia.connected", () => setStatus("Connected to Gladia"));
    socket.on("transcript.audio_chunk", (msg) => {
      console.log("transcript.partial", msg);

      setTranscript((prev) => ({
        ...prev,
        partial: msg.transcript || JSON.stringify(msg),
      }));
    });
    socket.on("transcript.final", (msg) => {
      console.log("transcript.final", msg);
      setTranscript((prev) => ({
        partial: "",
        final: [...prev.final, msg.transcript || JSON.stringify(msg)],
      }));
    });

    socket.on("error", (err) => {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function stopRecording() {
    if (!socketRef.current || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    socketRef.current.emit("stop");
    setIsRecording(false);
    setStatus("Stopped");

    // Stop all audio tracks and clear the stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-xl w-full bg-gray-800 rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          🎙️ Real-time Voice Transcription
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Connected status: <span className="text-green-400">{status}</span>
        </p>

        <div className="flex justify-center gap-4 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Stop Recording
            </button>
          )}
        </div>

        <AudioWaveform
          isRecording={isRecording}
          audioStream={audioStream}
          className="mb-6"
        />

        <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          <h3 className="font-semibold mb-2 text-yellow-400">
            Live Transcript:
          </h3>
          <p className="whitespace-pre-wrap text-gray-100">
            {transcript.partial}
          </p>
          {transcript.final.length > 0 && (
            <>
              <hr className="my-2 border-gray-600" />
              <h3 className="font-semibold mb-2 text-green-400">Finalized:</h3>
              {transcript.final.map((t, i) => (
                <p key={i} className="whitespace-pre-wrap text-gray-200">
                  {t}
                </p>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
