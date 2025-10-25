"use client";

import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
  className?: string;
}

export default function AudioWaveform({
  isRecording,
  audioStream,
  className = "",
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      // Stop animation when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // Set up audio context and analyser
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    analyserRef.current = analyser;
    audioContextRef.current = audioContext;

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    // Start animation loop
    const animate = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current)
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = "#1f2937"; // gray-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height,
          0,
          canvas.height - barHeight
        );
        gradient.addColorStop(0, "#10b981"); // emerald-500
        gradient.addColorStop(0.5, "#34d399"); // emerald-400
        gradient.addColorStop(1, "#6ee7b7"); // emerald-300

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, audioStream]);

  if (!isRecording) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`}
      >
        <div className="text-gray-400 text-sm">
          Audio waveform will appear here when recording
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-emerald-400">
        Audio Waveform
      </h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full h-30 rounded border border-gray-600"
      />
    </div>
  );
}
