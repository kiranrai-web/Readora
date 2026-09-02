import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBorrowed, getCurrentUser } from '../../services/borrowedService';

export default function Profile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [borrowedCount, setBorrowedCount] = useState(0);

  useEffect(() => {
    if (user) {
      getBorrowed().then((borrowed) => setBorrowedCount(borrowed.length));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-5">Please login to view your profile.</p>
          <button onClick={() => navigate('/login')} className="bg-[#FA7C54] text-white px-6 py-2 rounded-lg">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          Your <span className="text-[#FA7C54]">Profile</span>
        </h1>
        <div className="flex items-center gap-5 border-b border-gray-100 pb-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF0EA] flex items-center justify-center text-2xl font-bold text-[#FA7C54]">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{user.name || 'Reader'}</h2>
            <p className="text-sm text-gray-500">{user.email || 'No email available'}</p>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium text-gray-700">{user.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-medium text-gray-700">{user.email || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Total books borrowed</span><span className="font-medium text-gray-700">{borrowedCount}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Joined Readora</span><span className="font-medium text-gray-700">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>
    </div>
  );
}
