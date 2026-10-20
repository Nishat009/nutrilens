'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, KeyRound, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authApi, userApi } from '../../services/api-client';
import { useAuthStore } from '../../lib/stores/auth-store';

type Notice = { kind: 'success' | 'error'; text: string } | null;

const NoticeText = ({ notice }: { notice: Notice }) =>
  notice ? (
    <p className={`text-xs font-medium ${notice.kind === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
      {notice.text}
    </p>
  ) : null;

export function AccountSecurity() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [isChanging, setIsChanging] = useState(false);

  const [exportNotice, setExportNotice] = useState<Notice>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);
    setIsChanging(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordNotice({ kind: 'success', text: 'Password changed.' });
    } catch (error) {
      setPasswordNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not change password.' });
    } finally {
      setIsChanging(false);
    }
  };

  const exportData = async () => {
    setExportNotice(null);
    setIsExporting(true);
    try {
      const data = await userApi.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nutrilens-data.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not export your data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteNotice(null);
    setIsDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      logout();
      router.push('/');
    } catch (error) {
      setDeleteNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not delete your account.' });
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Account & Security</h2>

      <form onSubmit={changePassword} className="space-y-3">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          helperText="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" variant="secondary" isLoading={isChanging} leftIcon={<KeyRound className="w-4 h-4" />}>
          Change password
        </Button>
        <NoticeText notice={passwordNotice} />
      </form>

      <div className="pt-4 border-t border-slate-800 space-y-2">
        <p className="text-sm text-slate-400">Download a copy of your profile, meals, scans, planner and weight logs.</p>
        <Button type="button" variant="outline" isLoading={isExporting} onClick={exportData} leftIcon={<Download className="w-4 h-4" />}>
          Export my data
        </Button>
        <NoticeText notice={exportNotice} />
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <p className="text-sm text-slate-400">Deleting your account permanently removes your profile and all logged data. This cannot be undone.</p>
        {confirmingDelete ? (
          <form onSubmit={deleteAccount} className="space-y-3">
            <Input
              label="Confirm with your password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" isLoading={isDeleting} leftIcon={<Trash2 className="w-4 h-4" />}>
                Permanently delete
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setConfirmingDelete(false); setDeletePassword(''); setDeleteNotice(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete account
          </Button>
        )}
        <NoticeText notice={deleteNotice} />
      </div>
    </Card>
  );
}
