'use client';

import React from 'react';
import { FoodScanner } from '../../../components/scanner/FoodScanner';
import { ScanHistory } from '../../../components/scanner/ScanHistory';

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <FoodScanner />
      <ScanHistory />
    </div>
  );
}
