import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div id="toast-root" className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'success' ? '✓ ' : t.kind === 'error' ? '⚠ ' : ''}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
