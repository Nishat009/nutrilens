'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, Trash2, UserCog, AlertTriangle, Eye } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Modal } from '../../../../components/ui/Modal';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { adminApi } from '../../../../services/api-client';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { AdminUserDetail, AdminUserList } from '../../../../lib/types/admin';
import { cn } from '../../../../lib/utils/format';
import {
  ConfidencePill,
  Initials,
  PageHeader,
  Pagination,
  goalLabel,
  humanize,
  shortDate,
} from '../../../../components/admin/admin-ui';

const ROLE_FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'user', label: 'Members' },
  { value: 'admin', label: 'Admins' },
];

function MemberDetail({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const { user: currentUser } = useAuthStore();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<'role' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    adminApi
      .getUser(userId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this member.'));
  }, [userId]);

  const member = detail?.user;
  const isSelf = member?.id === currentUser?.id;
  const lockedReason = currentUser?.isDemo
    ? 'Read-only on the shared demo admin.'
    : member?.isDemo
      ? 'Demo accounts are managed automatically.'
      : isSelf
        ? 'You cannot change your own account here.'
        : '';

  const changeRole = async () => {
    if (!member) return;
    setBusy('role');
    setActionError('');
    try {
      const nextRole = member.role === 'admin' ? 'user' : 'admin';
      await adminApi.updateUserRole(member.id, nextRole);
      setDetail({ ...detail!, user: { ...member, role: nextRole } });
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the role.');
    } finally {
      setBusy(null);
    }
  };

  const deleteMember = async () => {
    if (!member) return;
    setBusy('delete');
    setActionError('');
    try {
      await adminApi.deleteUser(member.id);
      onChanged();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete this member.');
      setBusy(null);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={member?.name || 'Member'} description={member?.email} maxWidth="2xl">
      {error && <ErrorState message={error} />}
      {!error && !detail && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {member && detail && (
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant={member.role === 'admin' ? 'purple' : 'slate'}>{member.role === 'admin' ? 'Admin' : 'Member'}</Badge>
            {member.isDemo && <Badge variant="blue">Demo data</Badge>}
            {member.onboardingCompleted ? <Badge variant="emerald">Assessment complete</Badge> : <Badge variant="amber">Assessment pending</Badge>}
            <Badge variant="outline">Joined {shortDate(member.createdAt)}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Meals', detail.stats.meals],
              ['AI scans', detail.stats.scans],
              ['Weight logs', detail.stats.weightLogs],
              ['Planned slots', detail.stats.plannedMeals],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</div>
                <div className="text-xl font-black text-white tabular-nums">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Profile</div>
              <p className="text-slate-300">Goal: <span className="text-white">{goalLabel(member.primaryGoal)}</span></p>
              <p className="text-slate-300">
                Body: <span className="text-white">{member.heightCm} cm · {detail.stats.latestWeight?.weightKg ?? member.weightKg} kg → {member.targetWeightKg} kg</span>
              </p>
              <p className="text-slate-300">Activity: <span className="text-white">{humanize(member.activityLevel)}</span></p>
              <p className="text-slate-300">
                Conditions: <span className="text-white">{member.healthConditions.length ? member.healthConditions.map(humanize).join(', ') : 'None reported'}</span>
              </p>
              <p className="text-slate-300">
                Allergies: <span className="text-white">{member.allergies.length ? member.allergies.map(humanize).join(', ') : 'None'}</span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Personalized plan</div>
              {member.plan ? (
                <>
                  <p className="text-white font-semibold">{member.plan.dietName}</p>
                  <p className="text-slate-300">
                    {member.plan.targetCalories} kcal/day · TDEE {member.plan.tdee} kcal · BMI {member.plan.bmi} ({member.plan.bmiCategory})
                  </p>
                  {member.plan.requiresDoctorConsult && (
                    <p className="flex items-start gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Professional review advised
                    </p>
                  )}
                  {member.plan.safetyMessages.slice(0, 2).map((message) => (
                    <p key={message} className="text-slate-400 leading-snug">{message}</p>
                  ))}
                </>
              ) : (
                <p className="text-slate-400">No plan yet — the member has not finished the assessment.</p>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Recent meals</div>
            {detail.recentMeals.length ? (
              <ul className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/40">
                {detail.recentMeals.map((meal) => (
                  <li key={meal.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <div className="text-slate-200 truncate">{meal.foods.join(', ')}</div>
                      <div className="text-slate-500">{humanize(meal.type)} · {shortDate(meal.date)} {meal.time}</div>
                    </div>
                    <span className="text-slate-300 tabular-nums shrink-0">{Math.round(meal.totalCalories)} kcal</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No meals logged yet.</p>
            )}
          </div>

          {detail.recentScans.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Recent AI scans</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {detail.recentScans.map((scan) => (
                  <div key={scan.id} className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                    {scan.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={scan.imageUrl} alt="" className="w-full h-16 object-cover" />
                    )}
                    <div className="p-2 text-[10px] text-slate-300 flex items-center justify-between gap-1">
                      <span>{Math.round(scan.totalCalories)} kcal</span>
                      <ConfidencePill value={scan.avgConfidence} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-800 pt-4 space-y-3">
            {actionError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{actionError}</div>
            )}
            {lockedReason && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {lockedReason}</p>}
            {confirmDelete ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <p className="text-xs text-rose-200 flex-1">Delete {member.name} and all of their meals, scans, weight logs and planned meals? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button variant="danger" size="sm" isLoading={busy === 'delete'} onClick={deleteMember}>Delete member</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<UserCog className="w-4 h-4" />}
                  disabled={Boolean(lockedReason)}
                  isLoading={busy === 'role'}
                  onClick={changeRole}
                >
                  {member.role === 'admin' ? 'Remove admin access' : 'Make admin'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-900/60 text-rose-300 hover:bg-rose-950/40"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  disabled={Boolean(lockedReason)}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete member
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUserList | null>(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.getUsers({ search, role, page, limit: 10 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load members.');
    }
  }, [search, role, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Everyone with a NutriLens account, their assessment status, assigned plan and logging activity."
      />

      <Card padding="none">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-800/80">
          <div className="flex-1">
            <Input
              aria-label="Search members"
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800 self-start">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setRole(filter.value);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  role === filter.value ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : !data ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
        ) : data.users.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Search className="w-6 h-6" />} title="No members found" description="Try a different name, email or role filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                  <th className="font-semibold px-4 py-3">Member</th>
                  <th className="font-semibold px-4 py-3">Goal & plan</th>
                  <th className="font-semibold px-4 py-3 text-right">Meals</th>
                  <th className="font-semibold px-4 py-3 text-right">Scans</th>
                  <th className="font-semibold px-4 py-3">Last meal</th>
                  <th className="font-semibold px-4 py-3">Joined</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.users.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Initials name={member.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">{member.name}</span>
                            {member.role === 'admin' && (
                              <Badge variant="purple" size="sm"><ShieldCheck className="w-3 h-3" />Admin</Badge>
                            )}
                            {member.isDemo && <Badge variant="blue" size="sm">Demo</Badge>}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-200">{member.role === 'admin' ? '—' : goalLabel(member.primaryGoal)}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {member.dietName || (member.role === 'admin' ? '' : member.onboardingCompleted ? 'Plan not saved' : 'Assessment pending')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{member.mealCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{member.scanCount}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{shortDate(member.lastMealDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{shortDate(member.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(member.id)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.users.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </div>
        )}
      </Card>

      {selectedId && <MemberDetail userId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />}
    </div>
  );
}
