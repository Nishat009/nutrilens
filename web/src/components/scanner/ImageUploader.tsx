'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Scan, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { processAndCompressImage } from '../../lib/utils/image-utils';

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string) => void;
  onOpenLiveCamera: () => void;
}

const SAMPLE_DEMO_MEALS = [
  {
    label: 'Chicken & Steamed Rice Bowl',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
    desc: 'Chicken curry, steamed white rice, masoor dal',
  },
  {
    label: 'High-Protein Breakfast Plate',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    desc: 'Egg omelette, whole wheat roti, Greek yogurt',
  },
  {
    label: 'Atlantic Salmon & Quinoa',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    desc: 'Pan-seared salmon, tricolor quinoa, broccoli',
  },
  {
    label: 'Spiced Chickpea & Avocado Salad',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    desc: 'Chickpeas, avocado, spinach, olive oil',
  },
  {
    label: 'Grass-Fed Sirloin & Sweet Potato',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    desc: 'Sirloin steak, roasted sweet potato, greens',
  },
  {
    label: 'Acai Whey Smoothie Bowl',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80',
    desc: 'Oats, whey isolate, banana, almonds',
  },
];

export function ImageUploader({ onImageSelected, onOpenLiveCamera }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    const result = await processAndCompressImage(file);
    if (result.valid && result.dataUrl) {
      onImageSelected(result.dataUrl);
    } else {
      setErrorMessage(result.error || 'Failed to process image file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Drag-and-Drop Viewport */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 text-emerald-400 flex items-center justify-center mb-4 shadow-xl">
          <Scan className="w-8 h-8 stroke-[2]" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Take a photo or drop meal picture here
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
          Supports JPG, PNG, WEBP from your phone camera or gallery (Max 10MB)
        </p>

        {/* Hidden File Input for Native File/Camera Access */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="glow"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload Photo
          </Button>
          <Button
            variant="secondary"
            onClick={onOpenLiveCamera}
            leftIcon={<Camera className="w-4 h-4" />}
          >
            Open Live Camera
          </Button>
        </div>
      </div>

      {/* Sample Preset Meal Demonstrator */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Or try with sample meal photos:
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Instant Demo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_DEMO_MEALS.map((preset) => (
            <div
              key={preset.label}
              onClick={() => onImageSelected(preset.image)}
              className="group relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-md"
            >
              <img
                src={preset.image}
                alt={preset.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-3">
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {preset.label}
                </span>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                  {preset.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
