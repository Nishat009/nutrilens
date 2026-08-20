'use client';

import React, { useState } from 'react';
import { Sparkles, Camera, Upload, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ImageUploader } from './ImageUploader';
import { CameraCapture } from './CameraCapture';
import { FoodAnalysisLoader } from './FoodAnalysisLoader';
import { FoodAnalysisResult } from './FoodAnalysisResult';
import { recognizeFoodFromImage, FoodRecognitionResult } from '../../services/food-recognition';

export function FoodScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [scanResult, setScanResult] = useState<FoodRecognitionResult | null>(null);

  // When user selects an image from upload or presets
  const handleImageSelected = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setIsCameraActive(false);
  };

  // When user takes a photo with the live camera
  const handleCameraCapture = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setIsCameraActive(false);
  };

  // Start analysis pipeline
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setAnalysisProgress(15);

    // Progressive simulated stepped progress for smooth UX
    const timer1 = setTimeout(() => {
      setAnalysisStep(2);
      setAnalysisProgress(45);
    }, 700);

    const timer2 = setTimeout(() => {
      setAnalysisStep(3);
      setAnalysisProgress(75);
    }, 1400);

    const timer3 = setTimeout(() => {
      setAnalysisStep(4);
      setAnalysisProgress(92);
    }, 2000);

    try {
      const result = await recognizeFoodFromImage(selectedImage);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setAnalysisProgress(100);
      setTimeout(() => {
        setScanResult(result);
        setIsAnalyzing(false);
      }, 400);
    } catch (err) {
      console.error('Scan recognition error:', err);
      setIsAnalyzing(false);
    }
  };

  // Reset to initial upload state
  const handleReset = () => {
    setSelectedImage(null);
    setScanResult(null);
    setIsAnalyzing(false);
    setIsCameraActive(false);
    setAnalysisStep(1);
    setAnalysisProgress(0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      {!scanResult && (
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Free Open AI Food Vision
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Scan Your Meal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Photograph your food or upload from your gallery. NutriLens will identify ingredients, estimate portions, and calculate verified nutrition macros.
          </p>
        </div>
      )}

      {/* Main Viewport Card */}
      {scanResult && selectedImage ? (
        /* Results View */
        <FoodAnalysisResult
          image={selectedImage}
          initialResult={scanResult}
          onReset={handleReset}
        />
      ) : (
        <Card variant="glass" className="p-6 sm:p-10 border-slate-800 relative overflow-hidden">
          {isAnalyzing && selectedImage ? (
            /* Analyzing Stepper Loading Screen */
            <FoodAnalysisLoader
              imagePreview={selectedImage}
              step={analysisStep}
              progress={analysisProgress}
            />
          ) : isCameraActive ? (
            /* Live Camera Stream */
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={() => setIsCameraActive(false)}
            />
          ) : selectedImage ? (
            /* Image Preview & Confirmation Screen */
            <div className="space-y-6 text-center">
              <div className="relative rounded-3xl overflow-hidden max-w-md mx-auto aspect-[4/3] bg-slate-900 border border-slate-700 shadow-2xl">
                <img
                  src={selectedImage}
                  alt="Selected Food"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Change Photo
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={handleAnalyze}
                  leftIcon={<Sparkles className="w-5 h-5 stroke-[2.5]" />}
                  className="px-8 text-slate-950 font-bold"
                >
                  Analyze Food
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setSelectedImage(null)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Retake / Reset
                </Button>
              </div>
            </div>
          ) : (
            /* Default Image Uploader & Preset Selector */
            <ImageUploader
              onImageSelected={handleImageSelected}
              onOpenLiveCamera={() => setIsCameraActive(true)}
            />
          )}
        </Card>
      )}
    </div>
  );
}
