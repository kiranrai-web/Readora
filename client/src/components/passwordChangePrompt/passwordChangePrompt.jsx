import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LockKeyhole } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const API_BASE = 'http://localhost/Readora_API';

const readSignedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export default function PasswordChangePrompt() {
  const location = useLocation();
  const [user, setUser] = useState(readSignedInUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUser(readSignedInUser());
  }, [location.pathname, location.key]);

  if (!user?.must_change_password) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a new password different from your temporary password.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE}/api/change_password.php`, {
        user_id: user.id,
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (!response.data.success) {
        setError(response.data.message || 'Password could not be changed.');
        return;
      }

      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      console.error('Error changing temporary password:', requestError);
      setError(
        requestError.response?.data?.message ||
        'Password could not be changed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-temp-password-title"
        className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F16A43]/10">
          <LockKeyhole className="h-7 w-7 text-[#F16A43]" />
        </div>
        <h2 id="change-temp-password-title" className="text-center text-xl font-bold text-gray-900">
          Change your temporary password
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
          Your administrator gave you a temporary password. Set a new password to continue.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-gray-700">
            Temporary password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#F16A43]"
            />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#F16A43]"
            />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#F16A43]"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-[#F16A43] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e05831] disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? 'Changing password...' : 'Change password and continue'}
        </button>
      </form>
    </div>
  );
}
