'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { History, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { useScanStore } from '../../lib/stores/scan-store';
import { formatCalories } from '../../lib/utils/format';

const MAX_ITEMS = 5;

export function ScanHistory() {
  const { history, isLoadingHistory, fetchHistory } = useScanStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (isLoadingHistory && history.length === 0) return null;
  if (history.length === 0) return null;

  return (
    <Card variant="glass" className="p-5 border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <History className="w-4 h-4 text-emerald-400" /> Recent Scans
      </div>
      <ul className="divide-y divide-slate-800">
        {history.slice(0, MAX_ITEMS).map((scan) => (
          <li key={scan.id}>
            <Link
              href={`/scan/${scan.id}`}
              className="flex items-center justify-between gap-3 py-2.5 text-xs text-slate-300 hover:text-white"
            >
              <span className="truncate">
                {scan.detectedItems.map((item) => item.name).join(', ') || 'Unlabeled scan'}
              </span>
              <span className="flex items-center gap-2 shrink-0 text-slate-400">
                <span>{formatCalories(scan.totalCalories)} kcal</span>
                <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
