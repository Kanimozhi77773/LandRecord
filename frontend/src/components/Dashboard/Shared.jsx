import React from 'react';

export const confClass = (c) => {
  if (c === null || c === undefined) return '';
  return c >= 85 ? 'conf-hi' : c >= 70 ? 'conf-mid' : 'conf-lo';
};

export const StatusBadge = ({ status }) => {
  const map = {
    processing: ['badge-purple', 'Processing'],
    review: ['badge-amber', 'Needs Review'],
    completed: ['badge-green', 'Completed'],
    verified: ['badge-green', 'Verified'],
    discrepancy: ['badge-red', 'Discrepancy'],
    submitted: ['badge-purple', 'Submitted'],
    approved: ['badge-green', 'Approved'],
    returned: ['badge-red', 'Returned'],
  };
  const m = map[status] || ['badge-gray', status];
  return <span className={`badge ${m[0]}`}>{m[1]}</span>;
};

export const KPI = ({ label, val, sub, subClass, ic, bg, progress }) => (
  <div className="kpi-card">
    <div className="kpi-top">
      <span className="kpi-label">{label}</span>
      <div className="kpi-ic" style={{ background: bg }}>{ic}</div>
    </div>
    <div className="kpi-val">{val}</div>
    {sub && <div className={`kpi-sub ${subClass || ''}`}>{sub}</div>}
    {progress !== undefined && (
      <div className="progress"><i style={{ width: `${progress}%` }}></i></div>
    )}
  </div>
);

export const PageHead = ({ title, sub, rightBtn }) => (
  <div className="page-head-row">
    <div className="page-welcome" style={{ marginBottom: 0 }}>
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
    {rightBtn}
  </div>
);

export const EmptyState = ({ ic, title, sub }) => (
  <div className="panel">
    <div className="empty-state">
      <div className="e-ico">{ic}</div>
      <h4>{title}</h4>
      <p>{sub}</p>
    </div>
  </div>
);

export const SettingsPage = ({ name, roleLabel, onSave }) => {
  return (
    <>
      <PageHead title="Settings" sub="Manage your profile and preferences." />
      <div className="panel">
        <div className="panel-body">
          <div className="field">
            <label>Full name</label>
            <input type="text" defaultValue={name} />
          </div>
          <div className="field">
            <label>Role</label>
            <input type="text" value={roleLabel} disabled />
          </div>
          <div className="field">
            <label>Email notifications</label>
            <select defaultValue="All activity">
              <option>All activity</option>
              <option>Only important updates</option>
              <option>None</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </>
  );
};
