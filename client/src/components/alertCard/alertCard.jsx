import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function AlertCard({
  title = 'Something went wrong',
  message,
  actionLabel,
  onAction,
  onClose,
}) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-card-title"
        aria-describedby="alert-card-message"
        className="relative w-full max-w-sm rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-orange-50 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F16A43]/10">
          <AlertCircle className="h-6 w-6 text-[#F16A43]" />
        </div>
        <h2 id="alert-card-title" className="mb-2 text-lg font-bold text-gray-900">
          {title}
        </h2>
        <p id="alert-card-message" className="text-sm leading-relaxed text-gray-600">
          {message}
        </p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 w-full rounded-xl bg-[#F16A43] py-3 text-xs font-bold uppercase text-white shadow-md transition hover:bg-[#e05831]"
          >
            {actionLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-[#F16A43] py-3 text-xs font-bold uppercase text-white shadow-md transition hover:bg-[#e05831]"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
}
