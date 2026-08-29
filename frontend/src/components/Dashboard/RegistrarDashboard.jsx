import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Inbox, FolderOpen, AlertTriangle, History, ScrollText,
  BarChart3, Settings as SettingsIcon, LogOut, ChevronsLeft, ChevronsRight,
  CheckCircle2, XCircle, Eye, MapPin, Search, X, FileText, ShieldCheck
} from 'lucide-react';

/* =========================================================================
   MOCK DATA
   ========================================================================= */

const INITIAL_PENDING = [
  { id: 'LR-1021', survey: '125/2', village: 'Kinathukadavu', confidence: 43, issue: true,  operator: 'Anand P', owner: 'Ravi Kumar', area: '2.50 Acres' },
  { id: 'LR-1014', survey: '118/3', village: 'Anaimalai',     confidence: 98, issue: false, operator: 'Deepa N', owner: 'Meena R',    area: '1.2 Acres' },
  { id: 'LR-1009', survey: '54/2',  village: 'Sulur',         confidence: 99, issue: false, operator: 'Anand P', owner: 'Deepa N',    area: '3.1 Acres' },
  { id: 'LR-1017', survey: '77/1',  village: 'Madukkarai',    confidence: 94, issue: true,  operator: 'Deepa N', owner: 'Karthik S',  area: '0.8 Acres' },
];

const INITIAL_AUDIT = [
  { t: '9:02 AM', text: 'Authority approved record LR-1002' },
  { t: '9:41 AM', text: 'Authority returned LR-1006 to operator for correction' },
  { t: '10:15 AM', text: 'Authority resolved discrepancy DC-204' },
];

const INITIAL_DISCREPANCIES = [
  { id: 'DC-204', survey: '31/6', text: 'Recorded area conflicts with 2008 mutation record.', level: 'High' },
  { id: 'DC-205', survey: '99/2', text: 'Owner name spelling differs from tax record.', level: 'Medium' },
  { id: 'DC-206', survey: '12/1', text: 'Village boundary code mismatch.', level: 'Low' },
];

const NAV = [
  { group: 'Main', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Verification', items: [
    { id: 'pending', label: 'Pending', icon: Inbox },
    { id: 'records', label: 'Land Records', icon: FolderOpen },
  ] },
  { group: 'Oversight', items: [
    { id: 'discrepancy', label: 'Discrepancy', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: History },
    { id: 'audit', label: 'Audit', icon: ScrollText },
  ] },
  { group: 'Insights', items: [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }] },
];

/* =========================================================================
   HELPERS
   ========================================================================= */

function nowTime() {
  const d = new Date();
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function confClass(c) {
  if (c == null) return '';
  if (c >= 90) return 'high';
  if (c >= 75) return 'mid';
  return 'low';
}

const STATUS_META = {
  approved: { label: 'Approved', tone: 'green' },
  returned: { label: 'Returned', tone: 'gold' },
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

function KPI({ label, val, icon: Icon, tone = 'ink' }) {
  return (
    <div className="kpi">
      <div className={`kpi-ic tone-${tone}`}><Icon size={16} /></div>
      <div className="kpi-val">{val}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return <div className="empty-state"><Icon size={28} /><b>{title}</b><span>{sub}</span></div>;
}

/* =========================================================================
   ROOT COMPONENT
   ========================================================================= */

export default function RegistrarDashboard({ userName = 'Authority', onLogout = () => {}, addToast = () => {} }) {
  useEffect(() => {
    if (document.getElementById('reg-dash-fonts')) return;
    const link = document.createElement('link');
    link.id = 'reg-dash-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pending, setPending] = useState(INITIAL_PENDING);
  const [approved, setApproved] = useState(6);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [discrepancies, setDiscrepancies] = useState(INITIAL_DISCREPANCIES);
  const [reviewDoc, setReviewDoc] = useState(null);
  const [rejectId, setRejectId] = useState(null);

  function pushAudit(text) {
    setAudit(a => [...a, { t: nowTime(), text }]);
  }

  function handleApprove(id) {
    const idx = pending.findIndex(x => x.id === id);
    if (idx < 0) return;
    const r = pending[idx];
    setPending(p => p.filter(x => x.id !== id));
    setApproved(a => a + 1);
    pushAudit(`Authority approved record ${r.id}`);
    setReviewDoc(null);
    addToast(`${r.id} approved and added to master land record.`, 'success');
  }

  function handleReject(e) {
    e.preventDefault();
    const idx = pending.findIndex(x => x.id === rejectId);
    if (idx >= 0) {
      const r = pending[idx];
      setPending(p => p.filter(x => x.id !== rejectId));
      pushAudit(`Authority returned ${r.id} to operator for correction`);
    }
    setRejectId(null);
    setReviewDoc(null);
    addToast(`${rejectId} returned to operator with feedback.`, 'error');
  }

  function handleResolveDiscrepancy(id) {
    setDiscrepancies(d => d.filter(x => x.id !== id));
    pushAudit(`Authority resolved discrepancy ${id}`);
    addToast('Case marked resolved.', 'success');
  }

  const issues = pending.filter(r => r.issue).length;
  const counts = { High: 0, Medium: 0, Low: 0 };
  discrepancies.forEach(d => counts[d.level]++);

  function tl(year, text, i) {
    return <div key={i} className="tl-item"><div className="tl-dot" /><div><b>{text}</b><span>{year}</span></div></div>;
  }

  function pendingTable(rows) {
    return (
      <table>
        <thead><tr><th>Record</th><th>Survey</th><th>Village</th><th>AI Score</th><th>Issue</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="mono"><b>{r.id}</b></td>
              <td className="mono">{r.survey}</td><td>{r.village}</td>
              <td><span className={`conf ${confClass(r.confidence)}`}>{r.confidence}%</span></td>
              <td>{r.issue ? <span className="badge badge-gold">⚠ Flagged</span> : <span className="badge badge-ink">Clear</span>}</td>
              <td><button className="btn btn-outline btn-sm" onClick={() => setReviewDoc(r)}>Review →</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderDashboard() {
    return (
      <>
        <PageHead title={`Good Morning, ${userName} 👋`} sub="Records awaiting your verification." />
        <div className="kpi-grid">
          <KPI label="Pending" val={pending.length} icon={Inbox} />
          <KPI label="Reviewed This Week" val={18} icon={Eye} />
          <KPI label="Approved (All Time)" val={approved} icon={CheckCircle2} tone="green" />
          <KPI label="Flagged Issues" val={issues} icon={AlertTriangle} tone="gold" />
        </div>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head"><h3>RECORDS NEEDING REVIEW</h3><button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('pending')}>View all →</button></div>
          <div className="panel-body">{pendingTable(pending.slice(0, 4))}</div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>RECENT ACTIVITY</h3></div>
          <div className="panel-body timeline">
            {[...audit].reverse().slice(0, 4).map((a, i) => (
              <div key={i} className="tl-item"><div className="tl-dot" /><div><b>{a.text}</b><span>{a.t}</span></div></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderPending() {
    if (pending.length === 0) {
      return <><PageHead title="Pending Verification" sub="Records submitted by operators." /><EmptyState icon={CheckCircle2} title="Queue clear" sub="No records currently awaiting verification." /></>;
    }
    return (
      <>
        <PageHead title="Pending Verification" sub="Records submitted by operators, ordered by submission time." />
        <div className="panel"><div className="panel-body">{pendingTable(pending)}</div></div>
      </>
    );
  }

  function renderRecords() {
    return (
      <>
        <PageHead title="Land Records" sub="All records that have completed the verification process." />
        <div className="panel"><div className="panel-body">
          <table>
            <thead><tr><th>Survey No</th><th>Village</th><th>Status</th><th>Approved On</th></tr></thead>
            <tbody>
              <tr><td className="mono">125/1</td><td>ABC</td><td><StatusBadge status="approved" /></td><td>18 Aug 2026</td></tr>
              <tr><td className="mono">99/2</td><td>Sulur</td><td><StatusBadge status="approved" /></td><td>15 Aug 2026</td></tr>
              <tr><td className="mono">31/6</td><td>Anaimalai</td><td><StatusBadge status="approved" /></td><td>10 Aug 2026</td></tr>
            </tbody>
          </table>
        </div></div>
      </>
    );
  }

  function renderDiscrepancy() {
    return (
      <>
        <PageHead title="Discrepancy Review" sub="Cases where records conflict with historical data." />
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <KPI label="High" val={counts.High} icon={AlertTriangle} tone="gold" />
          <KPI label="Medium" val={counts.Medium} icon={AlertTriangle} />
          <KPI label="Low" val={counts.Low} icon={AlertTriangle} tone="green" />
        </div>
        <div className="panel"><div className="panel-body attention-list">
          {discrepancies.map(d => (
            <div key={d.id} className="attention-item">
              <div className="a-left"><b>{d.id} · Survey {d.survey}</b><span>{d.text}</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${d.level === 'High' ? 'badge-gold' : d.level === 'Medium' ? 'badge-ink' : 'badge-green'}`}>{d.level}</span>
                <button className="btn btn-outline btn-sm" onClick={() => handleResolveDiscrepancy(d.id)}>Resolve Case</button>
              </div>
            </div>
          ))}
          {discrepancies.length === 0 && <EmptyState icon={ShieldCheck} title="No discrepancies" sub="All cases resolved." />}
        </div></div>
      </>
    );
  }

  function renderHistory() {
    return (
      <>
        <PageHead title="Historical Timeline" sub="Trace a parcel's record across decades." />
        <div className="panel"><div className="panel-body timeline">
          {tl('1985', 'Ownership Record created', 1)}
          {tl('1998', 'Mutation recorded', 2)}
          {tl('2008', 'Registration updated', 3)}
          {tl('2015', 'Tax record filed', 4)}
          {tl('2026', 'Current digitized record', 5)}
        </div></div>
      </>
    );
  }

  function renderAudit() {
    return (
      <>
        <PageHead title="Audit / Change History" sub="Every change is logged and cannot be edited." />
        <div className="panel"><div className="panel-body timeline">
          {[...audit].reverse().map((a, i) => (
            <div key={i} className="tl-item"><div className="tl-dot" /><div><b>{a.text}</b><span>{a.t}</span></div></div>
          ))}
        </div></div>
      </>
    );
  }

  function renderAnalytics() {
    const days = [['Mon', 18], ['Tue', 26], ['Wed', 14], ['Thu', 30], ['Fri', 22]];
    return (
      <>
        <PageHead title="Analytics" sub="Verification throughput and extraction quality." />
        <div className="grid-2">
          <div className="panel">
            <div className="panel-head"><h3>RECORDS PROCESSED (THIS WEEK)</h3></div>
            <div className="panel-body bar-list">
              {days.map(([d, v], i) => (
                <div key={i} className="bar-item">
                  <div className="bar-top"><span>{d}</span><b>{v}</b></div>
                  <div className="bar-track"><i className="bar-gold" style={{ width: `${v * 3}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>AI EXTRACTION CONFIDENCE</h3></div>
            <div className="panel-body bar-list">
              <div className="bar-item"><div className="bar-top"><span>High</span><b>78%</b></div><div className="bar-track"><i className="bar-green" style={{ width: '78%' }} /></div></div>
              <div className="bar-item"><div className="bar-top"><span>Medium</span><b>15%</b></div><div className="bar-track"><i className="bar-gold" style={{ width: '15%' }} /></div></div>
              <div className="bar-item"><div className="bar-top"><span>Low</span><b>7%</b></div><div className="bar-track"><i className="bar-ink" style={{ width: '7%' }} /></div></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <PageHead title="Settings" sub="Your account preferences." />
        <div className="panel"><div className="panel-body">
          <div className="field"><label>Name</label><input type="text" defaultValue={userName} /></div>
          <div className="field"><label>Role</label><input type="text" defaultValue="Registration Authority" disabled /></div>
          <button className="btn btn-primary" onClick={() => addToast('Settings saved.', 'success')}>Save Changes</button>
        </div></div>
      </>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'pending': return renderPending();
      case 'records': return renderRecords();
      case 'discrepancy': return renderDiscrepancy();
      case 'history': return renderHistory();
      case 'audit': return renderAudit();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      default: return null;
    }
  }

  return (
    <div className="reg-dash">
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
            <span className="tb-chip">Authority</span>
          </div>
          <div className="tb-right">
            <div className="tb-search"><Search size={14} /><input placeholder="Search records…" /></div>
            <div className="tb-user"><MapPin size={13} /> {userName}</div>
          </div>
        </header>
        <div className="page">{renderContent()}</div>
      </div>

      {reviewDoc && (
        <div className="modal-overlay" onClick={() => setReviewDoc(null)}>
          <div className="modal modal-xwide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Record Review · {reviewDoc.id}</h3><p>Submitted by {reviewDoc.operator} · Survey {reviewDoc.survey}, {reviewDoc.village}</p></div>
              <button className="modal-close" onClick={() => setReviewDoc(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="split-3">
                <div className="doc-preview" style={{ minHeight: 260 }}>
                  <FileText size={26} /><span>Original document</span>
                </div>
                <div className="review-panel">
                  <h4 className="section-title">Extracted Data</h4>
                  <div className="field"><label>Owner Name</label><input type="text" defaultValue={reviewDoc.owner} /></div>
                  <div className="field"><label>Survey Number</label><input type="text" defaultValue={reviewDoc.survey} /></div>
                  <div className="field"><label>Area</label><input type="text" defaultValue={reviewDoc.area} /></div>
                  <div className="field"><label>Village</label><input type="text" defaultValue={reviewDoc.village} /></div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => addToast('Field changes saved.', 'success')}>Save Changes</button>
                </div>
                <div className="review-panel">
                  <h4 className="section-title">Validation</h4>
                  <div className="bar-list" style={{ marginBottom: 18 }}>
                    <div className="bar-item"><div className="bar-top"><span>Survey valid</span><b>✓</b></div></div>
                    <div className="bar-item"><div className="bar-top"><span>Village matched</span><b>✓</b></div></div>
                    <div className="bar-item"><div className="bar-top"><span>Area check</span><b>{reviewDoc.issue ? '⚠' : '✓'}</b></div></div>
                  </div>
                  <div className="kpi" style={{ marginBottom: 18 }}>
                    <div className="kpi-label" style={{ marginBottom: 6 }}>Confidence</div>
                    <div className="kpi-val" style={{ fontSize: 24 }}>{reviewDoc.confidence}%</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="btn btn-success" onClick={() => handleApprove(reviewDoc.id)}><CheckCircle2 size={15} /> Approve Record</button>
                    <button className="btn btn-danger" onClick={() => setRejectId(reviewDoc.id)}><XCircle size={15} /> Reject / Return</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Reject / Return Record</h3><p>{rejectId} will be sent back to the operator for correction.</p></div>
              <button className="modal-close" onClick={() => setRejectId(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleReject}>
                <div className="field"><label>Reason</label><textarea rows="4" required placeholder="e.g. Survey number is unclear…" /></div>
                <button type="submit" className="btn btn-danger btn-block">Return to Operator</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CSS — Authority / Gold theme
   ========================================================================= */

const CSS = `
:root{}
.reg-dash{
  --ink:#1B2A41; --ink-soft:#3B4A63; --ink-faint:#7C879B;
  --paper:#F6F4EE; --paper-raised:#FFFFFF; --line:#DCD6C6; --line-strong:#C7BFA9;
  --gold:#9C7A22; --gold-soft:#F2E7C8;
  --green:#2F4A3D; --green-soft:#E4EAE3;
  --navy-soft:#E2E7EF;
  display:flex; min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'IBM Plex Sans', system-ui, sans-serif; font-size:14px; line-height:1.5;
}
.reg-dash *{ box-sizing:border-box; }
.reg-dash h1,.reg-dash h2,.reg-dash h3,.reg-dash h4{ font-family:'Source Serif 4', Georgia, serif; margin:0; color:var(--ink); }
.reg-dash .mono{ font-family:'IBM Plex Mono', monospace; }
.reg-dash button{ font-family:inherit; cursor:pointer; }
.reg-dash input,.reg-dash select,.reg-dash textarea{ font-family:inherit; }

/* Sidebar */
.reg-dash .sidebar{ width:240px; background:var(--ink); color:#C9D2DE; display:flex; flex-direction:column; flex:none; transition:width .18s ease; }
.reg-dash .sidebar.collapsed{ width:72px; }
.reg-dash .sb-top{ display:flex; align-items:center; justify-content:space-between; padding:18px 16px; border-bottom:1px solid rgba(255,255,255,0.1); }
.reg-dash .brand{ display:flex; align-items:center; gap:10px; overflow:hidden; }
.reg-dash .brand-mark{ width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; flex:none; }
.reg-dash .brand-name{ font-family:'Source Serif 4', serif; font-size:16px; font-weight:600; color:#fff; white-space:nowrap; }
.reg-dash .brand-name em{ font-style:normal; color:var(--gold); }
.reg-dash .sb-toggle{ background:transparent; border:1px solid rgba(255,255,255,0.15); color:#C9D2DE; border-radius:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; flex:none; }
.reg-dash .sb-toggle:hover{ background:rgba(255,255,255,0.08); }
.reg-dash .sb-nav{ flex:1; overflow-y:auto; padding:14px 10px; }
.reg-dash .sb-group{ margin-bottom:16px; }
.reg-dash .sb-group-label{ font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:#7C879B; padding:0 10px; margin-bottom:6px; }
.reg-dash .sb-item{ display:flex; align-items:center; gap:11px; width:100%; padding:9px 10px; border:none; background:transparent; color:#C9D2DE; border-radius:4px; font-size:13.5px; font-weight:500; text-align:left; white-space:nowrap; overflow:hidden; }
.reg-dash .sb-item span{ overflow:hidden; text-overflow:ellipsis; }
.reg-dash .sb-item:hover{ background:rgba(255,255,255,0.06); color:#fff; }
.reg-dash .sb-item.active{ background:rgba(156,122,34,0.22); color:#fff; box-shadow:inset 2px 0 0 var(--gold); }
.reg-dash .sb-bottom{ padding:12px 10px 16px; border-top:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; gap:2px; }

/* Main / topbar */
.reg-dash .main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.reg-dash .topbar{ height:60px; background:var(--paper-raised); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 26px; flex:none; }
.reg-dash .tb-left{ display:flex; align-items:center; gap:12px; }
.reg-dash .tb-title{ font-family:'Source Serif 4', serif; font-weight:600; font-size:16px; }
.reg-dash .tb-chip{ font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; background:var(--gold-soft); color:var(--gold); padding:3px 9px; border-radius:2px; }
.reg-dash .tb-right{ display:flex; align-items:center; gap:18px; }
.reg-dash .tb-search{ display:flex; align-items:center; gap:8px; background:var(--paper); border:1px solid var(--line); border-radius:4px; padding:7px 12px; color:var(--ink-faint); }
.reg-dash .tb-search input{ border:none; background:transparent; outline:none; font-size:13px; width:170px; color:var(--ink); }
.reg-dash .tb-user{ display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-soft); font-weight:500; }

.reg-dash .page{ padding:30px 32px 60px; overflow-y:auto; }
.reg-dash .page-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
.reg-dash .page-head h2{ font-size:24px; font-weight:600; }
.reg-dash .page-head p{ margin:6px 0 0; color:var(--ink-soft); font-size:13.5px; }

/* KPI */
.reg-dash .kpi-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
.reg-dash .kpi{ background:var(--paper-raised); border:1px solid var(--line); padding:18px; position:relative; }
.reg-dash .kpi-ic{ width:30px; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.reg-dash .tone-ink{ background:var(--navy-soft); color:var(--ink); }
.reg-dash .tone-gold{ background:var(--gold-soft); color:var(--gold); }
.reg-dash .tone-green{ background:var(--green-soft); color:var(--green); }
.reg-dash .kpi-val{ font-family:'Source Serif 4', serif; font-size:26px; font-weight:600; }
.reg-dash .kpi-label{ font-size:12px; color:var(--ink-faint); margin-top:2px; }

/* Panels */
.reg-dash .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.reg-dash .panel{ background:var(--paper-raised); border:1px solid var(--line); }
.reg-dash .panel-head{ display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid var(--line); }
.reg-dash .panel-head h3{ font-family:'IBM Plex Mono', monospace; font-size:11.5px; letter-spacing:0.08em; color:var(--ink-faint); font-weight:500; }
.reg-dash .panel-body{ padding:20px; }

/* Buttons / forms */
.reg-dash .btn{ display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600; padding:10px 18px; border-radius:2px; border:1px solid var(--ink); background:transparent; }
.reg-dash .btn-primary{ background:var(--ink); color:#fff; border-color:var(--ink); }
.reg-dash .btn-primary:hover{ background:var(--ink-soft); }
.reg-dash .btn-outline{ color:var(--ink); border-color:var(--line-strong); }
.reg-dash .btn-outline:hover{ border-color:var(--gold); color:var(--gold); }
.reg-dash .btn-ghost{ border-color:transparent; color:var(--gold); padding:6px 10px; }
.reg-dash .btn-sm{ padding:8px 14px; font-size:12.5px; }
.reg-dash .btn-block{ width:100%; justify-content:center; }
.reg-dash .btn-success{ background:var(--green); color:#fff; border-color:var(--green); }
.reg-dash .btn-danger{ background:#8C2F2F; color:#fff; border-color:#8C2F2F; }

.reg-dash .field{ margin-bottom:14px; }
.reg-dash .field label{ display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-faint); margin-bottom:6px; }
.reg-dash .field input,.reg-dash .field select,.reg-dash .field textarea{ width:100%; padding:9px 11px; border:1px solid var(--line-strong); background:#fff; border-radius:2px; font-size:13.5px; color:var(--ink); }

/* Table */
.reg-dash table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.reg-dash th{ text-align:left; font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-faint); padding:8px 10px; border-bottom:1px solid var(--line); }
.reg-dash td{ padding:11px 10px; border-bottom:1px solid var(--line); }
.reg-dash .conf{ font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:12.5px; }
.reg-dash .conf.high{ color:var(--green); } .reg-dash .conf.mid{ color:var(--gold); } .reg-dash .conf.low{ color:#8C2F2F; }

.reg-dash .badge{ font-family:'IBM Plex Mono', monospace; font-size:11px; font-weight:600; padding:3px 9px; border-radius:2px; letter-spacing:0.03em; }
.reg-dash .badge-ink{ background:var(--navy-soft); color:var(--ink); }
.reg-dash .badge-gold{ background:var(--gold-soft); color:var(--gold); }
.reg-dash .badge-green{ background:var(--green-soft); color:var(--green); }

/* Attention list / discrepancies */
.reg-dash .attention-list{ display:flex; flex-direction:column; gap:14px; }
.reg-dash .attention-item{ display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px 16px; border:1px solid var(--line); background:var(--paper); }
.reg-dash .a-left b{ display:block; font-size:13.5px; margin-bottom:3px; }
.reg-dash .a-left span{ font-size:12.5px; color:var(--ink-soft); }

/* Bars */
.reg-dash .bar-list{ display:flex; flex-direction:column; gap:12px; }
.reg-dash .bar-top{ display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:5px; }
.reg-dash .bar-track{ height:7px; background:var(--line); border-radius:3px; overflow:hidden; }
.reg-dash .bar-track i{ display:block; height:100%; border-radius:3px; }
.reg-dash .bar-gold{ background:var(--gold); }
.reg-dash .bar-green{ background:var(--green); }
.reg-dash .bar-ink{ background:var(--ink-faint); }

.reg-dash .empty-state{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:50px 20px; color:var(--ink-faint); text-align:center; }
.reg-dash .empty-state b{ color:var(--ink); font-size:14.5px; }

.reg-dash .timeline{ display:flex; flex-direction:column; gap:16px; }
.reg-dash .tl-item{ display:flex; gap:12px; }
.reg-dash .tl-dot{ width:8px; height:8px; border-radius:50%; background:var(--gold); margin-top:6px; flex:none; }
.reg-dash .tl-item b{ display:block; font-size:13.5px; font-weight:500; }
.reg-dash .tl-item span{ font-size:11.5px; color:var(--ink-faint); }

/* Modal */
.reg-dash .modal-overlay{ position:fixed; inset:0; background:rgba(27,42,65,0.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.reg-dash .modal{ background:#fff; width:100%; max-width:560px; max-height:88vh; overflow:auto; border-radius:2px; }
.reg-dash .modal-xwide{ max-width:940px; }
.reg-dash .modal-head{ display:flex; justify-content:space-between; align-items:flex-start; padding:20px 24px; border-bottom:1px solid var(--line); }
.reg-dash .modal-head h3{ font-size:17px; font-weight:600; }
.reg-dash .modal-head p{ margin:4px 0 0; font-size:12.5px; color:var(--ink-faint); }
.reg-dash .modal-close{ background:transparent; border:none; color:var(--ink-faint); }
.reg-dash .split-3{ display:grid; grid-template-columns:1fr 1fr 1fr; }
.reg-dash .doc-preview{ padding:22px; border-right:1px solid var(--line); background:var(--paper); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--ink-faint); }
.reg-dash .review-panel{ padding:22px; border-right:1px solid var(--line); }
.reg-dash .review-panel:last-child{ border-right:none; }
.reg-dash .section-title{ font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.08em; color:var(--ink-faint); text-transform:uppercase; margin-bottom:14px; }

@media (max-width:1100px){
  .reg-dash .kpi-grid{ grid-template-columns:repeat(2,1fr); }
  .reg-dash .grid-2{ grid-template-columns:1fr; }
  .reg-dash .split-3{ grid-template-columns:1fr; }
}
`;
