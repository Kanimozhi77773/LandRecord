import React from 'react';

const initials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

export default function TopBar({ title, chip, userName }) {
  return (
    <div className="topbar">
      <div className="topbar-title">
        {title} <span className="role-chip">{chip}</span>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" title="Help">❓</button>
        <button className="icon-btn" title="Notifications">🔔</button>
        <div className="avatar">{initials(userName)}</div>
      </div>
    </div>
  );
}
