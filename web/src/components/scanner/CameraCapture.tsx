'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      setIsStarting(true);
      setCameraError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Camera stream error:', err);
        setCameraError(
          'Unable to access camera. Please ensure camera permissions are allowed, or upload a photo instead.'
        );
      } finally {
        setIsStarting(false);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (cameraError) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-white text-base">Camera Unavailable</h4>
        <p className="text-xs text-slate-400">{cameraError}</p>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Back to Photo Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center animate-in fade-in duration-300">
      {/* Viewfinder Frame */}
      <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/3] max-w-lg mx-auto border-2 border-emerald-500/60 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Viewfinder Target Reticle Overlay */}
        <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg" />
          <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg" />
          <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg" />
          <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg" />
          <span className="text-[11px] font-semibold text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
            Center your meal in the frame
          </span>
        </div>

        {/* Flip Camera Button */}
        <button
          type="button"
          onClick={toggleFacingMode}
          className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Flip camera"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Capture Controls */}
      <div className="flex justify-center items-center gap-4 pt-2">
        <Button variant="outline" onClick={onCancel} leftIcon={<X className="w-4 h-4" />}>
          Cancel
        </Button>
        <Button
          variant="glow"
          size="lg"
          onClick={handleCapture}
          disabled={isStarting}
          leftIcon={<Camera className="w-5 h-5 stroke-[2.5]" />}
          className="px-8"
        >
          Take Snap
        </Button>
      </div>
    </div>
  );
}
