import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Search, Map, FileText, ClipboardList, History, Bell,
  Settings as SettingsIcon, LogOut, ChevronsLeft, ChevronsRight, MapPin,
  X, Lock, Eye, CheckCircle2, Clock, PartyPopper
} from 'lucide-react';

/* =========================================================================
   MOCK DATA
   ========================================================================= */

const ALL_RECORDS = [
  { survey: '125/2', village: 'Kinathukadavu', taluk: 'Pollachi', district: 'Coimbatore', status: 'verified',     area: '2.50 Acres', classification: 'Agricultural' },
  { survey: '77/1',  village: 'Madukkarai',    taluk: 'Sulur',    district: 'Coimbatore', status: 'discrepancy', area: '0.80 Acres', classification: 'Residential' },
  { survey: '54/2',  village: 'Sulur',         taluk: 'Sulur',    district: 'Coimbatore', status: 'verified',     area: '3.10 Acres', classification: 'Agricultural' },
];

const MY_RECORDS = [ALL_RECORDS[0], ALL_RECORDS[1]];

const INITIAL_REQUESTS = [
  { id: 1020, type: 'Area Mismatch', stage: 1 },
  { id: 1015, type: 'Record Issue', stage: 3 },
];

const NAV = [
  { group: 'Main', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Records', items: [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'myparcels', label: 'My Parcels', icon: Map },
    { id: 'documents', label: 'Documents', icon: FileText },
  ] },
  { group: 'Support', items: [
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'history', label: 'History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] },
];

const STATUS_META = {
  verified: { label: 'Verified', tone: 'green' },
  discrepancy: { label: 'Discrepancy', tone: 'teal' },
  pending: { label: 'Pending', tone: 'ink' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'ink' };
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}

function PageHead({ title, sub, rightBtn }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{sub}</p></div>
      {rightBtn}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return <div className="empty-state"><Icon size={28} /><b>{title}</b><span>{sub}</span></div>;
}

/* =========================================================================
   ROOT COMPONENT
   ========================================================================= */

export default function CitizenDashboard({ userName = 'Citizen', onLogout = () => {}, addToast = () => {} }) {
  useEffect(() => {
    if (document.getElementById('cit-dash-fonts')) return;
    const link = document.createElement('link');
    link.id = 'cit-dash-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchResults, setSearchResults] = useState(null);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [reqCounter, setReqCounter] = useState(1020);
  const [viewParcel, setViewParcel] = useState(null);
  const [requestForm, setRequestForm] = useState(null);

  function handleSearch(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const village = fd.get('village');
    const survey = (fd.get('survey') || '').trim();
    const results = ALL_RECORDS.filter(r => {
      let ok = true;
      if (village) ok = ok && r.village === village;
      if (survey) ok = ok && r.survey.includes(survey);
      return ok;
    });
    setSearchResults(results);
    setActiveTab('search');
  }

  function handleRequestSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newId = reqCounter + 1;
    setReqCounter(newId);
    setRequests(r => [{ id: newId, type: fd.get('type'), stage: 0 }, ...r]);
    setRequestForm(null);
    setActiveTab('requests');
    addToast(`Request #${newId} submitted.`, 'success');
  }

  function renderDashboard() {
    return (
      <>
        <PageHead title={`Welcome, ${userName} 👋`} sub="Search and view your land records." />
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head"><h3>SEARCH LAND RECORD</h3></div>
          <div className="panel-body">
            <form onSubmit={handleSearch}>
              <div className="field-row">
                <div className="field"><label>District</label><select name="district"><option>Coimbatore</option></select></div>
                <div className="field"><label>Taluk</label><select name="taluk"><option>Pollachi</option><option>Coimbatore South</option></select></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Village</label>
                  <select name="village">
                    <option value="">Any</option>
                    <option>Kinathukadavu</option><option>Madukkarai</option><option>Sulur</option>
                  </select>
                </div>
                <div className="field"><label>Survey No.</label><input type="text" name="survey" placeholder="e.g. 125/2" /></div>
              </div>
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>
        </div>

        {searchResults && (
          searchResults.length === 0 ? (
            <div className="panel" style={{ marginBottom: 20 }}>
              <EmptyState icon={Search} title="No matching parcel found" sub="Try adjusting the district, taluk or survey number." />
            </div>
          ) : (
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-head"><h3>SEARCH RESULTS</h3></div>
              <div className="panel-body">
                {searchResults.map(r => (
                  <div key={r.survey} className="parcel-row">
                    <div className="p-left"><b>Survey {r.survey} · {r.village}</b><span>{r.taluk}, {r.district}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StatusBadge status={r.status} />
                      <button className="btn btn-primary btn-sm" onClick={() => setViewParcel(r.survey)}>View →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        <div className="panel">
          <div className="panel-head"><h3>MY RECENT RECORDS</h3></div>
          <div className="panel-body">
            {MY_RECORDS.map(r => (
              <div key={r.survey} className="parcel-row">
                <div className="p-left"><b>Survey {r.survey}</b><span>{r.village}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge status={r.status} />
                  <button className="btn btn-outline btn-sm" onClick={() => setViewParcel(r.survey)}>View →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderMyParcels() {
    return (
      <>
        <PageHead title="My Parcels" sub="Parcels associated with your verified identity." />
        <div className="panel"><div className="panel-body">
          <table>
            <thead><tr><th>Survey</th><th>Village</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {MY_RECORDS.map(r => (
                <tr key={r.survey}>
                  <td className="mono">{r.survey}</td><td>{r.village}</td><td><StatusBadge status={r.status} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setViewParcel(r.survey)}>View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </>
    );
  }

  function renderDocuments() {
    return (
      <>
        <PageHead title="Documents" sub="Access to documents depends on record type and permission level." />
        <div className="panel"><div className="panel-body doc-list">
          <div className="doc-row">
            <div className="d-left"><div className="d-ic"><FileText size={16} /></div><div><b>Land Record</b><span className="d-sub">Survey 125/2</span></div></div>
            <button className="btn btn-outline btn-sm" onClick={() => addToast('Opening document (view-only)…')}><Eye size={13} /> View</button>
          </div>
          <div className="doc-row">
            <div className="d-left"><div className="d-ic"><FileText size={16} /></div><div><b>Mutation Record</b><span className="d-sub">Survey 125/2</span></div></div>
            <button className="btn btn-outline btn-sm" onClick={() => addToast('Opening document (view-only)…')}><Eye size={13} /> View</button>
          </div>
          <div className="doc-row">
            <div className="d-left"><div className="d-ic locked"><Lock size={16} /></div><div><b>Registration Record</b><span className="d-sub locked">Restricted</span></div></div>
            <button className="btn btn-ghost btn-sm" disabled>Restricted</button>
          </div>
        </div></div>
      </>
    );
  }

  function renderRequests() {
    const steps = ['Submitted', 'Under Review', 'Action Taken', 'Resolved'];
    return (
      <>
        <PageHead title="Requests" sub="Report an issue with a land record and track its status."
                  rightBtn={<button className="btn btn-primary" onClick={() => setRequestForm('')}>+ New Request</button>} />
        {requests.length ? (
          <div className="panel"><div className="panel-body">
            {requests.map(r => (
              <div key={r.id} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <b style={{ fontFamily: "'Source Serif 4', serif" }}>Request #{r.id}</b>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{r.type}</span>
                </div>
                <div className="stepper">
                  {steps.map((s, i) => (
                    <div key={i} className={`st ${i <= r.stage ? 'on' : ''}`}>
                      <div className="line" /><div className="sc">{i + 1}</div><span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div></div>
        ) : <EmptyState icon={ClipboardList} title="No requests yet" sub="Raise a request if something looks wrong with your record." />}
      </>
    );
  }

  function renderHistory() {
    const tl = (year, text, i) => <div key={i} className="tl-item"><div className="tl-dot" /><div><b>{text}</b><span>{year}</span></div></div>;
    return (
      <>
        <PageHead title="Ownership / Record Timeline" sub="Publicly available historical information for your parcel." />
        <div className="panel"><div className="panel-body timeline">
          {tl('1985', 'Ownership Record', 1)}
          {tl('1998', 'Mutation', 2)}
          {tl('2008', 'Registration', 3)}
          {tl('2015', 'Tax Record', 4)}
          {tl('2026', 'Current Record', 5)}
        </div></div>
      </>
    );
  }

  function renderNotifications() {
    return (
      <>
        <PageHead title="Notifications" sub="Updates about your records and requests." />
        <div className="panel"><div className="panel-body">
          <div className="notif-row"><div className="n-ic done"><CheckCircle2 size={16} /></div><div><b>Your record for Survey 125/2 has been verified.</b><span>2 days ago</span></div></div>
          <div className="notif-row"><div className="n-ic pending"><Clock size={16} /></div><div><b>Request #1020 is under review.</b><span>5 days ago</span></div></div>
          <div className="notif-row"><div className="n-ic done"><PartyPopper size={16} /></div><div><b>Your submitted request has been resolved.</b><span>1 week ago</span></div></div>
        </div></div>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <PageHead title="Settings" sub="Your account preferences." />
        <div className="panel"><div className="panel-body">
          <div className="field"><label>Name</label><input type="text" defaultValue={userName} /></div>
          <div className="field"><label>Role</label><input type="text" defaultValue="Citizen" disabled /></div>
          <button className="btn btn-primary" onClick={() => addToast('Settings saved.', 'success')}>Save Changes</button>
        </div></div>
      </>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
      case 'search': return renderDashboard();
      case 'myparcels': return renderMyParcels();
      case 'documents': return renderDocuments();
      case 'requests': return renderRequests();
      case 'history': return renderHistory();
      case 'notifications': return renderNotifications();
      case 'settings': return renderSettings();
      default: return null;
    }
  }

  const currentParcel = viewParcel ? (ALL_RECORDS.find(x => x.survey === viewParcel) || ALL_RECORDS[0]) : null;

  return (
    <div className="cit-dash">
      <style>{CSS}</style>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sb-top">
          <div className="brand">
            <div className="brand-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 20V10L12 4L20 10V20" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 20V14H15V20" stroke="white" strokeWidth="1.8" />
              </svg>
            </div>
            {!collapsed && <span className="brand-name">Land<em>Intel</em></span>}
          </div>
          <button className="sb-toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <nav className="sb-nav">
          {NAV.map(g => (
            <div key={g.group} className="sb-group">
              {!collapsed && <div className="sb-group-label">{g.group}</div>}
              {g.items.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button key={item.id} className={`sb-item ${active ? 'active' : ''}`} onClick={() => setActiveTab(item.id)} title={collapsed ? item.label : undefined}>
                    <Icon size={17} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sb-bottom">
          <button className={`sb-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title={collapsed ? 'Settings' : undefined}>
            <SettingsIcon size={17} />{!collapsed && <span>Settings</span>}
          </button>
          <button className="sb-item" onClick={onLogout} title={collapsed ? 'Logout' : undefined}>
            <LogOut size={17} />{!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="tb-left">
            <span className="tb-title">LandIntel</span>
            <span className="tb-chip">Citizen</span>
          </div>
          <div className="tb-right">
            <div className="tb-search"><Search size={14} /><input placeholder="Search records…" /></div>
            <div className="tb-user"><MapPin size={13} /> {userName}</div>
          </div>
        </header>
        <div className="page">{renderContent()}</div>
      </div>

      {currentParcel && (
        <div className="modal-overlay" onClick={() => setViewParcel(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Land Parcel · Survey {currentParcel.survey}</h3><p>{currentParcel.village}, {currentParcel.taluk}, {currentParcel.district}</p></div>
              <button className="modal-close" onClick={() => setViewParcel(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="panel"><div className="panel-body">
                  <div className="kv-row"><span>Status</span><StatusBadge status={currentParcel.status} /></div>
                  <div className="kv-row"><span>Area</span><b>{currentParcel.area}</b></div>
                  <div className="kv-row"><span>Classification</span><b>{currentParcel.classification}</b></div>
                  {currentParcel.status === 'discrepancy' && (
                    <div className="warn-text">⚠ A discrepancy has been identified and is currently under review.</div>
                  )}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setRequestForm(currentParcel.survey); setViewParcel(null); }}>Report Issue</button>
                  </div>
                </div></div>
                <div className="gis-box">
                  <div className="gis-grid">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`gis-cell ${i === 4 ? 'sel' : ''}`}>{i === 4 ? currentParcel.survey : ''}</div>
                    ))}
                  </div>
                  <div className="gis-meta"><b>Survey {currentParcel.survey}</b><span>Selected parcel highlighted</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {requestForm !== null && (
        <div className="modal-overlay" onClick={() => setRequestForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Report / Request</h3><p>Let us know if something looks wrong with a record.</p></div>
              <button className="modal-close" onClick={() => setRequestForm(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRequestSubmit}>
                <div className="field"><label>Related survey no. (optional)</label><input type="text" defaultValue={requestForm} name="survey" /></div>
                <div className="field"><label>Type</label>
                  <select name="type"><option>Record Issue</option><option>Ownership Dispute</option><option>Area Mismatch</option><option>Other</option></select>
                </div>
                <div className="field"><label>Description</label><textarea rows="4" required placeholder="Describe the issue…" /></div>
                <button type="submit" className="btn btn-primary btn-block">Submit Request</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CSS — Public / Teal theme
   ========================================================================= */

const CSS = `
.cit-dash{
  --ink:#1B2A41; --ink-soft:#3B4A63; --ink-faint:#7C879B;
  --paper:#F3F6F4; --paper-raised:#FFFFFF; --line:#D6DED9; --line-strong:#C1CCC5;
  --teal:#1E7F6E; --teal-soft:#DCEFEA;
  --green:#2F4A3D; --green-soft:#E4EAE3;
  --navy-soft:#E2E7EF;
  display:flex; min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'IBM Plex Sans', system-ui, sans-serif; font-size:14px; line-height:1.5;
}
.cit-dash *{ box-sizing:border-box; }
.cit-dash h1,.cit-dash h2,.cit-dash h3,.cit-dash h4{ font-family:'Source Serif 4', Georgia, serif; margin:0; color:var(--ink); }
.cit-dash .mono{ font-family:'IBM Plex Mono', monospace; }
.cit-dash button{ font-family:inherit; cursor:pointer; }
.cit-dash input,.cit-dash select,.cit-dash textarea{ font-family:inherit; }

/* Sidebar */
.cit-dash .sidebar{ width:240px; background:var(--ink); color:#C9D2DE; display:flex; flex-direction:column; flex:none; transition:width .18s ease; }
.cit-dash .sidebar.collapsed{ width:72px; }
.cit-dash .sb-top{ display:flex; align-items:center; justify-content:space-between; padding:18px 16px; border-bottom:1px solid rgba(255,255,255,0.1); }
.cit-dash .brand{ display:flex; align-items:center; gap:10px; overflow:hidden; }
.cit-dash .brand-mark{ width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; flex:none; }
.cit-dash .brand-name{ font-family:'Source Serif 4', serif; font-size:16px; font-weight:600; color:#fff; white-space:nowrap; }
.cit-dash .brand-name em{ font-style:normal; color:var(--teal); }
.cit-dash .sb-toggle{ background:transparent; border:1px solid rgba(255,255,255,0.15); color:#C9D2DE; border-radius:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; flex:none; }
.cit-dash .sb-toggle:hover{ background:rgba(255,255,255,0.08); }
.cit-dash .sb-nav{ flex:1; overflow-y:auto; padding:14px 10px; }
.cit-dash .sb-group{ margin-bottom:16px; }
.cit-dash .sb-group-label{ font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:#7C879B; padding:0 10px; margin-bottom:6px; }
.cit-dash .sb-item{ display:flex; align-items:center; gap:11px; width:100%; padding:9px 10px; border:none; background:transparent; color:#C9D2DE; border-radius:4px; font-size:13.5px; font-weight:500; text-align:left; white-space:nowrap; overflow:hidden; }
.cit-dash .sb-item span{ overflow:hidden; text-overflow:ellipsis; }
.cit-dash .sb-item:hover{ background:rgba(255,255,255,0.06); color:#fff; }
.cit-dash .sb-item.active{ background:rgba(30,127,110,0.24); color:#fff; box-shadow:inset 2px 0 0 var(--teal); }
.cit-dash .sb-bottom{ padding:12px 10px 16px; border-top:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; gap:2px; }

/* Main / topbar */
.cit-dash .main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.cit-dash .topbar{ height:60px; background:var(--paper-raised); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 26px; flex:none; }
.cit-dash .tb-left{ display:flex; align-items:center; gap:12px; }
.cit-dash .tb-title{ font-family:'Source Serif 4', serif; font-weight:600; font-size:16px; }
.cit-dash .tb-chip{ font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; background:var(--teal-soft); color:var(--teal); padding:3px 9px; border-radius:2px; }
.cit-dash .tb-right{ display:flex; align-items:center; gap:18px; }
.cit-dash .tb-search{ display:flex; align-items:center; gap:8px; background:var(--paper); border:1px solid var(--line); border-radius:4px; padding:7px 12px; color:var(--ink-faint); }
.cit-dash .tb-search input{ border:none; background:transparent; outline:none; font-size:13px; width:170px; color:var(--ink); }
.cit-dash .tb-user{ display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-soft); font-weight:500; }

.cit-dash .page{ padding:30px 32px 60px; overflow-y:auto; }
.cit-dash .page-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
.cit-dash .page-head h2{ font-size:24px; font-weight:600; }
.cit-dash .page-head p{ margin:6px 0 0; color:var(--ink-soft); font-size:13.5px; }

/* Panels */
.cit-dash .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.cit-dash .panel{ background:var(--paper-raised); border:1px solid var(--line); }
.cit-dash .panel-head{ display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid var(--line); }
.cit-dash .panel-head h3{ font-family:'IBM Plex Mono', monospace; font-size:11.5px; letter-spacing:0.08em; color:var(--ink-faint); font-weight:500; }
.cit-dash .panel-body{ padding:20px; }

/* Buttons / forms */
.cit-dash .btn{ display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600; padding:10px 18px; border-radius:2px; border:1px solid var(--ink); background:transparent; }
.cit-dash .btn-primary{ background:var(--teal); color:#fff; border-color:var(--teal); }
.cit-dash .btn-primary:hover{ background:#186B5D; border-color:#186B5D; }
.cit-dash .btn-outline{ color:var(--ink); border-color:var(--line-strong); }
.cit-dash .btn-outline:hover{ border-color:var(--teal); color:var(--teal); }
.cit-dash .btn-ghost{ border-color:transparent; color:var(--teal); padding:6px 10px; }
.cit-dash .btn-sm{ padding:8px 14px; font-size:12.5px; }
.cit-dash .btn-block{ width:100%; justify-content:center; }

.cit-dash .field{ margin-bottom:14px; }
.cit-dash .field label{ display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-faint); margin-bottom:6px; }
.cit-dash .field input,.cit-dash .field select,.cit-dash .field textarea{ width:100%; padding:9px 11px; border:1px solid var(--line-strong); background:#fff; border-radius:2px; font-size:13.5px; color:var(--ink); }
.cit-dash .field-row{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }

/* Table */
.cit-dash table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.cit-dash th{ text-align:left; font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-faint); padding:8px 10px; border-bottom:1px solid var(--line); }
.cit-dash td{ padding:11px 10px; border-bottom:1px solid var(--line); }

.cit-dash .badge{ font-family:'IBM Plex Mono', monospace; font-size:11px; font-weight:600; padding:3px 9px; border-radius:2px; letter-spacing:0.03em; }
.cit-dash .badge-ink{ background:var(--navy-soft); color:var(--ink); }
.cit-dash .badge-teal{ background:var(--teal-soft); color:var(--teal); }
.cit-dash .badge-green{ background:var(--green-soft); color:var(--green); }

/* Parcel rows */
.cit-dash .parcel-row{ display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--line); }
.cit-dash .parcel-row:last-child{ border-bottom:none; }
.cit-dash .p-left b{ display:block; font-size:13.5px; margin-bottom:3px; }
.cit-dash .p-left span{ font-size:12px; color:var(--ink-faint); }

/* Docs */
.cit-dash .doc-list{ display:flex; flex-direction:column; gap:2px; }
.cit-dash .doc-row{ display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--line); }
.cit-dash .doc-row:last-child{ border-bottom:none; }
.cit-dash .d-left{ display:flex; align-items:center; gap:12px; }
.cit-dash .d-ic{ width:32px; height:32px; border-radius:6px; background:var(--teal-soft); color:var(--teal); display:flex; align-items:center; justify-content:center; flex:none; }
.cit-dash .d-ic.locked{ background:var(--navy-soft); color:var(--ink-faint); }
.cit-dash .d-sub{ font-size:12px; color:var(--ink-faint); }
.cit-dash .d-sub.locked{ color:#9AA5B4; }

/* Requests stepper */
.cit-dash .stepper{ display:flex; align-items:flex-start; gap:0; }
.cit-dash .st{ flex:1; position:relative; text-align:center; }
.cit-dash .st .line{ position:absolute; top:11px; left:-50%; width:100%; height:2px; background:var(--line-strong); z-index:0; }
.cit-dash .st:first-child .line{ display:none; }
.cit-dash .st .sc{ width:24px; height:24px; border-radius:50%; background:var(--paper-raised); border:2px solid var(--line-strong); color:var(--ink-faint); display:flex; align-items:center; justify-content:center; margin:0 auto 6px; position:relative; z-index:1; font-size:11.5px; font-weight:600; }
.cit-dash .st span{ font-size:11px; color:var(--ink-faint); }
.cit-dash .st.on .line{ background:var(--teal); }
.cit-dash .st.on .sc{ background:var(--teal); border-color:var(--teal); color:#fff; }
.cit-dash .st.on span{ color:var(--ink); font-weight:500; }

/* Notifications */
.cit-dash .notif-row{ display:flex; gap:14px; align-items:flex-start; padding:14px 0; border-bottom:1px solid var(--line); }
.cit-dash .notif-row:last-child{ border-bottom:none; }
.cit-dash .n-ic{ width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex:none; }
.cit-dash .n-ic.done{ background:var(--green-soft); color:var(--green); }
.cit-dash .n-ic.pending{ background:var(--teal-soft); color:var(--teal); }
.cit-dash .notif-row b{ display:block; font-size:13.5px; font-weight:500; margin-bottom:3px; }
.cit-dash .notif-row span{ font-size:11.5px; color:var(--ink-faint); }

.cit-dash .empty-state{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:50px 20px; color:var(--ink-faint); text-align:center; }
.cit-dash .empty-state b{ color:var(--ink); font-size:14.5px; }

.cit-dash .timeline{ display:flex; flex-direction:column; gap:16px; }
.cit-dash .tl-item{ display:flex; gap:12px; }
.cit-dash .tl-dot{ width:8px; height:8px; border-radius:50%; background:var(--teal); margin-top:6px; flex:none; }
.cit-dash .tl-item b{ display:block; font-size:13.5px; font-weight:500; }
.cit-dash .tl-item span{ font-size:11.5px; color:var(--ink-faint); }

/* Modal */
.cit-dash .modal-overlay{ position:fixed; inset:0; background:rgba(27,42,65,0.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.cit-dash .modal{ background:#fff; width:100%; max-width:520px; max-height:88vh; overflow:auto; border-radius:2px; }
.cit-dash .modal-wide{ max-width:780px; }
.cit-dash .modal-head{ display:flex; justify-content:space-between; align-items:flex-start; padding:20px 24px; border-bottom:1px solid var(--line); }
.cit-dash .modal-head h3{ font-size:17px; font-weight:600; }
.cit-dash .modal-head p{ margin:4px 0 0; font-size:12.5px; color:var(--ink-faint); }
.cit-dash .modal-close{ background:transparent; border:none; color:var(--ink-faint); }
.cit-dash .modal-body{ padding:22px 24px; }
.cit-dash .kv-row{ display:flex; justify-content:space-between; align-items:center; padding:9px 0; font-size:13.5px; }
.cit-dash .kv-row span{ color:var(--ink-faint); }
.cit-dash .warn-text{ margin-top:12px; padding:10px 12px; background:var(--teal-soft); color:#8A5A1E; font-size:12.5px; border-radius:2px; }

/* GIS box */
.cit-dash .gis-box{ background:var(--ink); border-radius:2px; padding:16px; display:flex; flex-direction:column; gap:12px; }
.cit-dash .gis-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
.cit-dash .gis-cell{ aspect-ratio:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono', monospace; font-size:11px; color:#C9D2DE; }
.cit-dash .gis-cell.sel{ background:var(--teal); border-color:var(--teal); color:#fff; font-weight:600; }
.cit-dash .gis-meta{ color:#C9D2DE; }
.cit-dash .gis-meta b{ display:block; font-size:13px; margin-bottom:2px; }
.cit-dash .gis-meta span{ font-size:11.5px; color:#8A95A6; }

@media (max-width:1100px){
  .cit-dash .grid-2{ grid-template-columns:1fr; }
}
`;
