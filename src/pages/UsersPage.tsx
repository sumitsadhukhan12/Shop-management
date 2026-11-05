import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  KeyRound,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Lock,
  Phone,
  Mail
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { success, error } = useToast();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<StaffUser | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ users: StaffUser[] }>('/users/staff');
      setUsers(res.users || []);
    } catch (err: any) {
      error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !password) {
      error('Name, mobile number and password are required.');
      return;
    }

    setIsCreating(true);
    try {
      await apiRequest('/users/staff', {
        method: 'POST',
        body: JSON.stringify({ name, mobile, email, password, role })
      });
      success(`User account for ${name} created successfully.`);
      setShowAddModal(false);
      setName('');
      setMobile('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to create staff member.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await apiRequest(`/users/staff/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      success(`Account status changed to ${newStatus}.`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (user: StaffUser) => {
    try {
      await apiRequest(`/users/staff/${user.id}`, { method: 'DELETE' });
      success(`Account for ${user.name} removed.`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to delete user.');
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newStaffPassword) return;

    setIsResetting(true);
    try {
      await apiRequest('/auth/admin-reset-password', {
        method: 'POST',
        body: JSON.stringify({
          staffId: resetTargetUser.id,
          newPassword: newStaffPassword
        })
      });
      success(`Password for ${resetTargetUser.name} updated successfully.`);
      setResetTargetUser(null);
      setNewStaffPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        Access restricted. Only Administrators can manage staff and accounts.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-500" />
            <span>{t('staffManagementTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administered by Subodh Sadhukhan. Create staff credentials, reset passwords, or deactivate accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addStaff')}</span>
        </button>
      </div>

      {/* Test Account Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900 dark:text-amber-200">
            Development Account Notice:
          </span>{' '}
          <span className="text-amber-800 dark:text-amber-300">
            {t('testAccountNotice')}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Staff Name</th>
                <th className="py-3 px-3 font-semibold">Mobile Number</th>
                <th className="py-3 px-3 font-semibold">Email</th>
                <th className="py-3 px-3 font-semibold">Role</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Last Login</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => {
                const isTestAccount = u.id === 'user_staff_test' || u.name === 'Test Staff';
                const isSelf = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {isTestAccount && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            TEST ACCOUNT
                          </span>
                        )}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {u.mobile}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {u.email}
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Staff</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetTargetUser(u);
                            setNewStaffPassword('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Reset Password"
                          aria-label={`Reset password for ${u.name}`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              title="Delete Account"
                              aria-label={`Delete ${u.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="add-staff-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span>Create Staff Account</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Pal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Used for Login) *
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 9831000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@sadhukhan.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="staff">Staff (Billing, Search, Due Collection)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetTargetUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-target-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="reset-target-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Reset Staff Password</span>
              </h2>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Set a new password for <span className="font-bold text-slate-800 dark:text-slate-200">{resetTargetUser.name}</span> ({resetTargetUser.mobile}).
            </p>

            <form onSubmit={handleAdminResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={e => setNewStaffPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg disabled:opacity-50"
                >
                  {isResetting ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
