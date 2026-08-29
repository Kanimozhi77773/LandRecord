import React from 'react';

const brandMark = () => (
  <div className="brand" style={{ color: '#fff', padding: '0 10px', marginBottom: '26px', fontSize: '17px' }}>
    <div className="brand-mark" style={{ width: '32px', height: '32px' }}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 20V10L12 4L20 10V20" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20V14H15V20" stroke="white" strokeWidth="1.8" />
      </svg>
    </div>
    <span>Land<span className="accent">Intel</span></span>
  </div>
);

export default function Sidebar({ navGroups, activeTab, onTabChange, onLogout }) {
  return (
    <aside className="sidebar">
      {brandMark()}
      {navGroups.map((g) => (
        <div key={g.group} className="side-group">
          <div className="side-label">{g.group}</div>
          {g.items.map(([key, ic, label]) => (
            <button
              key={key}
              className={`side-link ${activeTab === key ? 'active' : ''}`}
              onClick={() => onTabChange(key)}
            >
              <span className="ic">{ic}</span>{label}
            </button>
          ))}
        </div>
      ))}
      <div className="side-bottom">
        <button className={`side-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onTabChange('settings')}>
          <span className="ic">⚙️</span>Settings
        </button>
        <button className="side-link" onClick={onLogout}>
          <span className="ic">↩️</span>Logout
        </button>
      </div>
    </aside>
  );
}
