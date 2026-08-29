import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, FileText, UploadCloud, RefreshCw, PencilLine, Send,
  AlertTriangle, History, Settings as SettingsIcon, LogOut, ChevronsLeft, ChevronsRight,
  CheckCircle2, Circle, XCircle, Eye, Printer, MapPin, Sparkles, ChevronRight,
  X, Search, Loader2, ScanLine, FileCheck2, ImageIcon
} from 'lucide-react';

/* =========================================================================
   MOCK DATA
   ========================================================================= */

const INITIAL_DOCS = [
  { id: 'LR-1014', type: 'PDF',   village: 'Anaimalai',      taluk: 'Pollachi', status: 'submitted',  confidence: 98, owner: 'Meena R',       survey: '118/3', area: '1.2 Acres' },
  { id: 'LR-1017', type: 'Image', village: 'Madukkarai',     taluk: 'Sulur',    status: 'validated',   confidence: 94, owner: 'Karthik S',     survey: '77/1',  area: '0.8 Acres' },
  { id: 'LR-1021', type: 'PDF',   village: 'Kinathukadavu',  taluk: 'Pollachi', status: 'review',      confidence: 43, owner: 'Ravi Kumar',    survey: '125/2', area: '2.50 Aores' },
  { id: 'LR-1023', type: 'Image', village: 'Anaimalai',      taluk: 'Pollachi', status: 'extraction',  confidence: null, owner: '—', survey: '—', area: '—' },
  { id: 'LR-1009', type: 'PDF',   village: 'Sulur',          taluk: 'Sulur',    status: 'submitted',  confidence: 99, owner: 'Deepa N',       survey: '54/2',  area: '3.1 Acres' },
];

const INITIAL_SUBMITTED = [
  { id: 'LR-1014', survey: '118/3', village: 'Anaimalai', confidence: 98 },
  { id: 'LR-1009', survey: '54/2',  village: 'Sulur',     confidence: 99 },
];

const INITIAL_ACTIVITY = [
  { t: '9:02 AM', text: 'Uploaded LR-1023 (survey_scan_04.jpg)' },
  { t: '9:18 AM', text: 'LR-1021 flagged for review (low-confidence field)' },
  { t: '9:41 AM', text: 'Submitted LR-1014 for verification' },
];

const NAV = [
  { group: 'Main', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Documents', items: [
    { id: 'documents', label: 'All Documents', icon: FileText },
    { id: 'upload', label: 'Upload Document', icon: UploadCloud },
    { id: 'processing', label: 'Processing', icon: RefreshCw },
    { id: 'review', label: 'Review Required', icon: PencilLine },
    { id: 'submitted', label: 'Submitted', icon: Send },
  ] },
  { group: 'Records', items: [
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
    { id: 'viewdoc', label: 'View Document', icon: Eye },
  ] },
  { group: 'Activity', items: [{ id: 'activity', label: 'My Activity', icon: History }] },
];

const PREPROCESS_STEPS = ['Uploaded', 'Quality analyzed', 'Noise removed', 'Image enhanced', 'Page aligned', 'Layout detected'];

const FIELD_DEFS = [
  { key: 'owner', label: 'Owner' },
  { key: 'survey', label: 'Survey No' },
  { key: 'khata', label: 'Khata No' },
  { key: 'area', label: 'Area' },
  { key: 'village', label: 'Village' },
  { key: 'classification', label: 'Classification' },
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

function genFields(lowIndex) {
  const base = [
    { key: 'owner', label: 'Owner', value: 'RAVI KUMAR', confidence: 97 },
    { key: 'survey', label: 'Survey No', value: '125/2', confidence: 99 },
    { key: 'khata', label: 'Khata No', value: '458', confidence: 96 },
    { key: 'area', label: 'Area', value: '2.50 Acres', confidence: 91 },
    { key: 'village', label: 'Village', value: 'ABC', confidence: 98 },
    { key: 'classification', label: 'Classification', value: 'Agricultural', confidence: 87 },
  ];
  if (lowIndex != null) {
    const f = base[lowIndex];
    base[lowIndex] = {
      ...f,
      value: f.key === 'area' ? '2.50 Aores' : f.value,
      confidence: 35 + Math.floor(Math.random() * 30),
    };
  }
  return base;
}

const STATUS_META = {
  preprocessing: { label: 'Preprocessing', tone: 'ink' },
  ocr: { label: 'OCR', tone: 'ink' },
  extraction: { label: 'Extracting', tone: 'ink' },
  review: { label: 'Needs Review', tone: 'rust' },
  validated: { label: 'Validated', tone: 'green' },
  submitted: { label: 'Submitted', tone: 'navy' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'ink' };
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}

/* =========================================================================
   ROOT COMPONENT
   ========================================================================= */

export default function OperatorDashboard({ userName = 'Operator', onLogout = () => {}, addToast = () => {} }) {
  useEffect(() => {
    if (document.getElementById('op-dash-fonts')) return;
    const link = document.createElement('link');
    link.id = 'op-dash-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [submitted, setSubmitted] = useState(INITIAL_SUBMITTED);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [selectedFile, setSelectedFile] = useState(null);
  const [meta, setMeta] = useState({ docType: 'Ownership Record', state: 'Tamil Nadu', district: 'Coimbatore', taluk: 'Pollachi', village: 'Kinathukadavu' });
  const [pipeline, setPipeline] = useState(null);
  const [reviewDoc, setReviewDoc] = useState(null);
  const [localFields, setLocalFields] = useState([]);
  const [activeFieldKey, setActiveFieldKey] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [viewDocId, setViewDocId] = useState(null);
  const fileInputRef = useRef(null);

  function pushActivity(text) {
    setActivity(a => [...a, { t: nowTime(), text }]);
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  }

  function runPipeline(id) {
    const ocrLines = [
      { text: 'Survey No: 125/2', confidence: 99 },
      { text: 'Owner Name: RAVI KUMAR', confidence: 97 },
      { text: 'Area: 2.50 Aores', confidence: 43 },
      { text: 'Village: ABC', confidence: 98 },
    ];
    const fields = genFields(3); // degrade "area" to demonstrate the low-confidence flow

    setPipeline({ docId: id, stage: 'preprocessing', preSteps: [], ocrLines: [], fields: [] });

    PREPROCESS_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setPipeline(p => (p && p.docId === id) ? { ...p, preSteps: [...p.preSteps, step] } : p);
      }, 350 * (i + 1));
    });

    const t1 = 350 * PREPROCESS_STEPS.length + 400;
    setTimeout(() => {
      setPipeline(p => (p && p.docId === id) ? { ...p, stage: 'ocr' } : p);
      setDocs(ds => ds.map(d => d.id === id ? { ...d, status: 'ocr' } : d));
      pushActivity(`OCR started for ${id}`);
    }, t1);

    const t2 = t1 + 1300;
    setTimeout(() => {
      setPipeline(p => (p && p.docId === id) ? { ...p, ocrLines } : p);
    }, t2);

    const t3 = t2 + 1100;
    setTimeout(() => {
      setPipeline(p => (p && p.docId === id) ? { ...p, stage: 'extraction', fields } : p);
      setDocs(ds => ds.map(d => d.id === id ? { ...d, status: 'extraction' } : d));
      pushActivity(`Fields extracted for ${id}`);
    }, t3);

    const t4 = t3 + 900;
    setTimeout(() => {
      const needsReview = fields.some(f => f.confidence < 75);
      const byKey = {}; fields.forEach(f => { byKey[f.key] = f.value; });
      setDocs(ds => ds.map(d => d.id === id ? {
        ...d,
        status: needsReview ? 'review' : 'validated',
        confidence: Math.min(...fields.map(f => f.confidence)),
        owner: byKey.owner, survey: byKey.survey, area: byKey.area, village: d.village || byKey.village,
        fields, ocrLines,
      } : d));
      pushActivity(needsReview ? `${id} flagged for review (low-confidence field)` : `${id} auto-validated — all fields high confidence`);
      addToast(needsReview ? `${id} needs your review.` : `${id} validated automatically.`);
      setPipeline(p => (p && p.docId === id) ? { ...p, stage: needsReview ? 'review' : 'validated' } : p);
    }, t4);
  }

  function handleStartProcessing(e) {
    e.preventDefault();
    if (!selectedFile) { addToast('Please select a file first.'); return; }
    const id = 'LR-' + (1029 + Math.floor(Math.random() * 900));
    const newDoc = { id, type: selectedFile.type.includes('pdf') ? 'PDF' : 'Image', village: meta.village, taluk: meta.taluk, status: 'preprocessing', confidence: null, owner: '—', survey: '—', area: '—' };
    setDocs(d => [newDoc, ...d]);
    pushActivity(`Uploaded ${id} (${selectedFile.name})`);
    addToast(`${id} uploaded — AI pipeline started.`);
    setActiveTab('processing');
    setSelectedFile(null);
    runPipeline(id);
  }

  function openReview(doc) {
    const fields = doc.fields || genFields(null);
    setLocalFields(fields.map(f => ({ ...f, resolved: f.confidence >= 75 })));
    setReviewDoc(doc);
    const firstLow = fields.find(f => f.confidence < 75);
    setActiveFieldKey(firstLow ? firstLow.key : null);
    if (firstLow) setDraftValue(firstLow.value);
  }

  function confirmField(key) {
    setLocalFields(fs => fs.map(f => f.key === key ? { ...f, resolved: true } : f));
    const next = localFields.find(f => f.key !== key && !f.resolved);
    setActiveFieldKey(next ? next.key : null);
    if (next) setDraftValue(next.value);
  }

  function saveCorrection(key) {
    setLocalFields(fs => fs.map(f => f.key === key ? { ...f, value: draftValue, confidence: 99, resolved: true } : f));
    const next = localFields.find(f => f.key !== key && !f.resolved);
    setActiveFieldKey(next ? next.key : null);
    if (next) setDraftValue(next.value);
  }

  function submitReview() {
    const byKey = {}; localFields.forEach(f => { byKey[f.key] = f.value; });
    const conf = Math.min(...localFields.map(f => f.confidence));
    setDocs(ds => ds.map(d => d.id === reviewDoc.id ? { ...d, status: 'submitted', confidence: conf, owner: byKey.owner, survey: byKey.survey, area: byKey.area, village: byKey.village, fields: localFields } : d));
    setSubmitted(s => [...s, { id: reviewDoc.id, survey: byKey.survey, village: byKey.village, confidence: conf }]);
    pushActivity(`Submitted ${reviewDoc.id} for verification`);
    addToast(`${reviewDoc.id} submitted for officer verification.`, 'success');
    setReviewDoc(null);
    setActiveTab('submitted');
  }

  const counts = {
    uploaded: docs.length,
    inProgress: docs.filter(d => ['preprocessing', 'ocr', 'extraction'].includes(d.status)).length,
    review: docs.filter(d => d.status === 'review').length,
    submitted: submitted.length,
  };
  const pct = Math.round((counts.submitted / (counts.uploaded || 1)) * 100);
  const allResolved = localFields.every(f => f.resolved);

  /* ---------------------------------------------------------------------
     PAGE RENDERERS
     --------------------------------------------------------------------- */

  function renderDashboard() {
    return (
      <>
        <PageHead title={`Good Morning, ${userName} 👋`} sub="Here's today's digitization activity." />
        <div className="kpi-grid">
          <KPI label="Uploaded Today" val={counts.uploaded} icon={UploadCloud} />
          <KPI label="In AI Pipeline" val={counts.inProgress} icon={RefreshCw} />
          <KPI label="Needs Review" val={counts.review} icon={PencilLine} tone="rust" />
          <KPI label="Submitted" val={counts.submitted} icon={Send} tone="green" />
          <KPI label="Completion" val={pct + '%'} icon={FileCheck2} progress={pct} />
        </div>
        <div className="grid-2">
          <div className="panel">
            <div className="panel-head"><h3>PROCESSING PIPELINE</h3></div>
            <div className="panel-body">
              <div className="stage-row">
                <Stage n={counts.uploaded} label="Uploaded" />
                <StageArrow />
                <Stage n={counts.inProgress} label="AI Processing" />
                <StageArrow />
                <Stage n={counts.review} label="Needs Review" />
                <StageArrow />
                <Stage n={counts.submitted} label="Submitted" />
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>QUICK ACTIONS</h3></div>
            <div className="panel-body quick-actions">
              <button className="qa-btn" onClick={() => setActiveTab('upload')}><UploadCloud size={17} /> Upload New Record</button>
              <button className="qa-btn" onClick={() => setActiveTab('review')}><PencilLine size={17} /> Review Extraction</button>
              <button className="qa-btn" onClick={() => setActiveTab('viewdoc')}><Eye size={17} /> View a Document</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderUpload() {
    return (
      <>
        <PageHead title="Upload Document" sub="Add a new legacy land record for AI processing." />
        <div className="panel">
          <div className="panel-body">
            <div className="dropzone">
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileChange}
                     style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <div className="dz-ico">{selectedFile ? <FileCheck2 size={26} /> : <UploadCloud size={26} />}</div>
              <b>{selectedFile ? selectedFile.name : 'Drop land record here'}</b>
              <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · ready to process` : 'PDF · JPG · PNG · TIFF'}</span>
              {!selectedFile && <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 14, pointerEvents: 'none' }}>Browse File</button>}
            </div>

            <form onSubmit={handleStartProcessing}>
              <div className="field-row">
                <div className="field"><label>Document Type</label>
                  <select value={meta.docType} onChange={e => setMeta({ ...meta, docType: e.target.value })}>
                    <option>Ownership Record</option><option>Sale Deed</option><option>Mutation Record</option><option>Cadastral Map</option>
                  </select>
                </div>
                <div className="field"><label>State</label>
                  <select value={meta.state} onChange={e => setMeta({ ...meta, state: e.target.value })}><option>Tamil Nadu</option></select>
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>District</label>
                  <select value={meta.district} onChange={e => setMeta({ ...meta, district: e.target.value })}><option>Coimbatore</option></select>
                </div>
                <div className="field"><label>Taluk</label>
                  <select value={meta.taluk} onChange={e => setMeta({ ...meta, taluk: e.target.value })}><option>Pollachi</option><option>Sulur</option></select>
                </div>
              </div>
              <div className="field"><label>Village</label>
                <select value={meta.village} onChange={e => setMeta({ ...meta, village: e.target.value })}>
                  <option>Kinathukadavu</option><option>Anaimalai</option><option>Madukkarai</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block"><Sparkles size={16} /> Start Processing</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  function renderProcessing() {
    const live = pipeline;
    const otherProcessing = docs.filter(d => ['preprocessing', 'ocr', 'extraction'].includes(d.status) && d.id !== live?.docId);

    return (
      <>
        <PageHead title="Processing" sub="Documents currently going through the AI pipeline." />

        {live && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-head"><h3>DOCUMENT {live.docId}</h3><StatusBadge status={live.stage} /></div>
            <div className="panel-body">

              <div className="pipe-section">
                <div className="pipe-label"><ScanLine size={13} /> PREPROCESSING</div>
                <div className="checklist">
                  {PREPROCESS_STEPS.map(step => {
                    const done = live.preSteps.includes(step);
                    return (
                      <div key={step} className={`check-step ${done ? 'done' : 'pending'}`}>
                        <div className="c-dot">{done ? <CheckCircle2 size={14} /> : <Circle size={12} />}</div>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                  {live.stage === 'preprocessing' && live.preSteps.length === PREPROCESS_STEPS.length && (
                    <div className="check-step active"><div className="c-dot"><Loader2 size={14} className="spin" /></div><span>Preparing for OCR…</span></div>
                  )}
                </div>
              </div>

              {live.stage !== 'preprocessing' && (
                <div className="pipe-section">
                  <div className="pipe-label"><FileText size={13} /> PRINTED TEXT — RAW OCR</div>
                  {live.ocrLines.length === 0 ? (
                    <div className="skeleton-lines"><Loader2 size={14} className="spin" /> Reading document…</div>
                  ) : (
                    <div className="ocr-block">
                      {live.ocrLines.map((l, i) => (
                        <div key={i} className="ocr-line">
                          <span className="mono">{l.text}</span>
                          <span className={`conf ${confClass(l.confidence)}`}>{l.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {live.fields.length > 0 && (
                <div className="pipe-section">
                  <div className="pipe-label"><Sparkles size={13} /> EXTRACTED LAND INFORMATION</div>
                  <div className="fields-table">
                    {live.fields.map(f => (
                      <div key={f.key} className="fields-row">
                        <span className="fk">{f.label}</span>
                        <span className="fv mono">{f.value}</span>
                        <span className={`conf ${confClass(f.confidence)}`}>{f.confidence}% {f.confidence >= 75 ? '✓' : '⚠'}</span>
                      </div>
                    ))}
                  </div>
                  {(live.stage === 'review' || live.stage === 'validated') && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}
                            onClick={() => openReview(docs.find(d => d.id === live.docId))}>
                      {live.stage === 'review' ? 'Resolve Flagged Field →' : 'Review & Submit →'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {otherProcessing.map(d => (
          <div key={d.id} className="panel" style={{ marginBottom: 14 }}>
            <div className="panel-head"><h3>DOCUMENT {d.id}</h3><StatusBadge status={d.status} /></div>
            <div className="panel-body"><span className="muted">Working through the AI pipeline…</span></div>
          </div>
        ))}

        {!live && otherProcessing.length === 0 && (
          <EmptyState icon={CheckCircle2} title="Nothing processing right now" sub="Upload a document to start the AI pipeline." />
        )}
      </>
    );
  }

  function docTable(ds, withAction) {
    return (
      <table>
        <thead><tr><th>Document</th><th>Type</th><th>Village</th><th>Status</th><th>Confidence</th>{withAction && <th></th>}</tr></thead>
        <tbody>
          {ds.map(d => (
            <tr key={d.id}>
              <td className="mono"><b>{d.id}</b></td><td>{d.type}</td><td>{d.village}</td><td><StatusBadge status={d.status} /></td>
              <td>{d.confidence != null ? <span className={`conf ${confClass(d.confidence)}`}>{d.confidence}%</span> : '—'}</td>
              {withAction && (
                <td>
                  {d.status === 'review' && <button className="btn btn-ghost btn-sm" onClick={() => openReview(d)}>Review →</button>}
                  {d.status === 'validated' && <button className="btn btn-ghost btn-sm" onClick={() => openReview(d)}>Submit →</button>}
                  {(d.status === 'submitted') && <button className="btn btn-ghost btn-sm" onClick={() => { setViewDocId(d.id); setActiveTab('viewdoc'); }}>View →</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderDocuments() {
    return (
      <>
        <PageHead title="All Documents" sub="Every document uploaded for digitization."
                  rightBtn={<button className="btn btn-primary" onClick={() => setActiveTab('upload')}><UploadCloud size={15} /> Upload Document</button>} />
        <div className="panel"><div className="panel-body">{docTable(docs, true)}</div></div>
      </>
    );
  }

  function renderReviewOrIssues(kind) {
    const list = kind === 'issues' ? docs.filter(d => d.confidence != null && d.confidence < 75) : docs.filter(d => d.status === 'review');
    if (list.length === 0) return <><PageHead title={kind === 'issues' ? 'Issues' : 'Review Required'} sub="Documents needing your check." /><EmptyState icon={CheckCircle2} title="All caught up" sub="No documents currently need review." /></>;
    return (
      <>
        <PageHead title={kind === 'issues' ? 'Issues' : 'Review Required'} sub="Documents needing your check." />
        <div className="panel"><div className="panel-body">{docTable(list, true)}</div></div>
      </>
    );
  }

  function renderSubmitted() {
    if (submitted.length === 0) return <><PageHead title="Submitted" sub="Records sent for officer verification." /><EmptyState icon={Send} title="Nothing submitted yet" sub="Records you submit will appear here." /></>;
    return (
      <>
        <PageHead title="Submitted" sub="Records sent for officer verification." />
        <div className="panel"><div className="panel-body">
          <table>
            <thead><tr><th>Record</th><th>Survey No</th><th>Village</th><th>Confidence</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {submitted.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td><td>{r.survey}</td><td>{r.village}</td>
                  <td className={`conf ${confClass(r.confidence)}`}>{r.confidence}%</td>
                  <td><StatusBadge status="submitted" /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => { setViewDocId(r.id); setActiveTab('viewdoc'); }}><Eye size={13} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </>
    );
  }

  function renderActivity() {
    return (
      <>
        <PageHead title="My Activity" sub="A log of your own actions on this platform." />
        <div className="panel"><div className="panel-body timeline">
          {[...activity].reverse().map((a, i) => (
            <div key={i} className="tl-item"><div className="tl-dot" /><div><b>{a.text}</b><span>{a.t}</span></div></div>
          ))}
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
          <div className="field"><label>Role</label><input type="text" defaultValue="Operator" disabled /></div>
          <button className="btn btn-primary" onClick={() => addToast('Settings saved.', 'success')}>Save Changes</button>
        </div></div>
      </>
    );
  }

  function renderViewDocument() {
    const candidates = docs.filter(d => d.status === 'submitted' || d.status === 'validated');
    const doc = candidates.find(d => d.id === viewDocId) || candidates[0];
    return (
      <>
        <PageHead title="View Document" sub="The finalized record, formatted for print or official reference." />
        <div className="viewdoc-layout">
          <div className="panel viewdoc-list">
            <div className="panel-head"><h3>FINALIZED RECORDS</h3></div>
            <div className="panel-body" style={{ padding: 0 }}>
              {candidates.length === 0 && <div style={{ padding: 20 }}><span className="muted">Nothing validated or submitted yet.</span></div>}
              {candidates.map(d => (
                <div key={d.id} className={`vd-row ${doc && doc.id === d.id ? 'active' : ''}`} onClick={() => setViewDocId(d.id)}>
                  <span className="mono">{d.id}</span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>

          {doc && (
            <div className="print-area">
              <div className="extract-card">
                <div className="extract-head">
                  <div>
                    <div className="label">Register Extract</div>
                    <div className="id">Survey No. {doc.survey}</div>
                  </div>
                  <div className="seal-mark">VERIFIED&nbsp;COPY</div>
                </div>
                <div className="extract-row"><span className="k">Owner</span><span className="v">{doc.owner}</span></div>
                <div className="extract-row"><span className="k">Village</span><span className="v">{doc.village}</span></div>
                <div className="extract-row"><span className="k">Taluk</span><span className="v">{doc.taluk}</span></div>
                <div className="extract-row"><span className="k">Area</span><span className="v">{doc.area}</span></div>
                <div className="extract-row"><span className="k">Status</span><span className="status-chip">{doc.status === 'submitted' ? 'Submitted' : 'Validated'}</span></div>
                <div className="extract-foot">
                  Hash-chained · SHA-256 linked audit trail<br />
                  Confidence score {doc.confidence}% · Digitized by Operator {userName}
                </div>
              </div>
              <button className="btn btn-outline no-print" style={{ marginTop: 16 }} onClick={() => window.print()}>
                <Printer size={15} /> Print Document
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'upload': return renderUpload();
      case 'processing': return renderProcessing();
      case 'documents': return renderDocuments();
      case 'review': return renderReviewOrIssues('review');
      case 'issues': return renderReviewOrIssues('issues');
      case 'submitted': return renderSubmitted();
      case 'activity': return renderActivity();
      case 'settings': return renderSettings();
      case 'viewdoc': return renderViewDocument();
      default: return null;
    }
  }

  /* ---------------------------------------------------------------------
     LAYOUT
     --------------------------------------------------------------------- */

  return (
    <div className="op-dash">
      <style>{CSS}</style>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} no-print`}>
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
        <header className="topbar no-print">
          <div className="tb-left">
            <span className="tb-title">LandIntel</span>
            <span className="tb-chip">Operator</span>
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
              <div><h3>Review Extraction · {reviewDoc.id}</h3><p>Confirm correct fields, correct any the AI got wrong.</p></div>
              <button className="modal-close" onClick={() => setReviewDoc(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="split">
                <div className="doc-preview">
                  <div className="dp-page">
                    <div className="dp-line" style={{ width: '70%' }} />
                    <div className="dp-line" style={{ width: '55%' }} />
                    {localFields.map(f => (
                      <div key={f.key} className={`dp-crop ${activeFieldKey === f.key ? 'focus' : ''} ${f.confidence < 75 ? 'low' : ''}`}
                           onClick={() => { setActiveFieldKey(f.key); setDraftValue(f.value); }}>
                        <span className="mono">{f.label}: {f.value}</span>
                      </div>
                    ))}
                    <div className="dp-line" style={{ width: '40%' }} />
                  </div>
                  <span className="dp-caption"><ImageIcon size={12} /> Original document · click a highlighted region to jump to that field</span>
                </div>

                <div className="review-panel">
                  <h4 className="section-title">Extracted Information</h4>
                  <div className="fields-list">
                    {localFields.map(f => (
                      <div key={f.key} className={`review-field ${activeFieldKey === f.key ? 'active' : ''} ${f.resolved ? 'resolved' : 'flagged'}`}>
                        <div className="rf-top">
                          <span className="rf-label">{f.label}</span>
                          <span className={`conf ${confClass(f.confidence)}`}>{f.confidence}% {f.resolved ? '✓' : '⚠'}</span>
                        </div>
                        {activeFieldKey === f.key ? (
                          <>
                            <div className="rf-ocr">OCR result: <span className="mono">{f.value}</span></div>
                            <input className="rf-input" value={draftValue} onChange={e => setDraftValue(e.target.value)} />
                            <div className="rf-actions">
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => confirmField(f.key)}>Confirm As-Is</button>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveCorrection(f.key)}>Save Correction</button>
                            </div>
                          </>
                        ) : (
                          <div className="rf-value mono" onClick={() => { setActiveFieldKey(f.key); setDraftValue(f.value); }}>{f.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-block" disabled={!allResolved} onClick={submitReview} style={{ marginTop: 16, opacity: allResolved ? 1 : 0.5 }}>
                    <Send size={15} /> Submit for Verification →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   SMALL SHARED PIECES
   ========================================================================= */

function PageHead({ title, sub, rightBtn }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{sub}</p></div>
      {rightBtn}
    </div>
  );
}

function KPI({ label, val, icon: Icon, tone = 'ink', progress }) {
  return (
    <div className="kpi">
      <div className={`kpi-ic tone-${tone}`}><Icon size={16} /></div>
      <div className="kpi-val">{val}</div>
      <div className="kpi-label">{label}</div>
      {progress != null && <div className="kpi-progress"><div style={{ width: `${progress}%` }} /></div>}
    </div>
  );
}

function Stage({ n, label }) { return <div className="stage"><b>{n}</b><span>{label}</span></div>; }
function StageArrow() { return <div className="stage-arrow"><ChevronRight size={16} /></div>; }

function EmptyState({ icon: Icon, title, sub }) {
  return <div className="empty-state"><Icon size={28} /><b>{title}</b><span>{sub}</span></div>;
}

/* =========================================================================
   CSS
   ========================================================================= */

const CSS = `
:root{
  --ink:#1B2A41; --ink-soft:#3B4A63; --ink-faint:#7C879B;
  --paper:#F6F5F0; --paper-raised:#FFFFFF; --line:#DCD9CE; --line-strong:#C7C3B5;
  --rust:#C1502E; --rust-soft:#F4E3DC;
  --green:#2F4A3D; --green-soft:#E4EAE3;
  --navy-soft:#E2E7EF;
}
.op-dash{ display:flex; min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'IBM Plex Sans', system-ui, sans-serif; font-size:14px; line-height:1.5; }
.op-dash *{ box-sizing:border-box; }
.op-dash h1,.op-dash h2,.op-dash h3,.op-dash h4{ font-family:'Source Serif 4', Georgia, serif; margin:0; color:var(--ink); }
.op-dash .mono{ font-family:'IBM Plex Mono', monospace; }
.op-dash button{ font-family:inherit; cursor:pointer; }
.op-dash input,.op-dash select{ font-family:inherit; }
.spin{ animation:spin 1s linear infinite; }
@keyframes spin{ to{ transform:rotate(360deg); } }

/* Sidebar */
.sidebar{ width:240px; background:var(--ink); color:#C9D2DE; display:flex; flex-direction:column; flex:none; transition:width .18s ease; }
.sidebar.collapsed{ width:72px; }
.sb-top{ display:flex; align-items:center; justify-content:space-between; padding:18px 16px; border-bottom:1px solid rgba(255,255,255,0.1); }
.brand{ display:flex; align-items:center; gap:10px; overflow:hidden; }
.brand-mark{ width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; flex:none; }
.brand-name{ font-family:'Source Serif 4', serif; font-size:16px; font-weight:600; color:#fff; white-space:nowrap; }
.brand-name em{ font-style:normal; color:var(--rust); }
.sb-toggle{ background:transparent; border:1px solid rgba(255,255,255,0.15); color:#C9D2DE; border-radius:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; flex:none; }
.sb-toggle:hover{ background:rgba(255,255,255,0.08); }
.sb-nav{ flex:1; overflow-y:auto; padding:14px 10px; }
.sb-group{ margin-bottom:16px; }
.sb-group-label{ font-family:'IBM Plex Mono', monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:#7C879B; padding:0 10px; margin-bottom:6px; }
.sb-item{ display:flex; align-items:center; gap:11px; width:100%; padding:9px 10px; border:none; background:transparent; color:#C9D2DE; border-radius:4px; font-size:13.5px; font-weight:500; text-align:left; white-space:nowrap; overflow:hidden; }
.sb-item span{ overflow:hidden; text-overflow:ellipsis; }
.sb-item:hover{ background:rgba(255,255,255,0.06); color:#fff; }
.sb-item.active{ background:rgba(193,80,46,0.18); color:#fff; box-shadow:inset 2px 0 0 var(--rust); }
.sb-bottom{ padding:12px 10px 16px; border-top:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; gap:2px; }

/* Main / topbar */
.main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.topbar{ height:60px; background:var(--paper-raised); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:0 26px; flex:none; }
.tb-left{ display:flex; align-items:center; gap:12px; }
.tb-title{ font-family:'Source Serif 4', serif; font-weight:600; font-size:16px; }
.tb-chip{ font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; background:var(--rust-soft); color:var(--rust); padding:3px 9px; border-radius:2px; }
.tb-right{ display:flex; align-items:center; gap:18px; }
.tb-search{ display:flex; align-items:center; gap:8px; background:var(--paper); border:1px solid var(--line); border-radius:4px; padding:7px 12px; color:var(--ink-faint); }
.tb-search input{ border:none; background:transparent; outline:none; font-size:13px; width:170px; color:var(--ink); }
.tb-user{ display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-soft); font-weight:500; }

.page{ padding:30px 32px 60px; overflow-y:auto; }
.page-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
.page-head h2{ font-size:24px; font-weight:600; }
.page-head p{ margin:6px 0 0; color:var(--ink-soft); font-size:13.5px; }

/* KPI */
.kpi-grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:24px; }
.kpi{ background:var(--paper-raised); border:1px solid var(--line); padding:18px; position:relative; }
.kpi-ic{ width:30px; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.tone-ink{ background:var(--navy-soft); color:var(--ink); }
.tone-rust{ background:var(--rust-soft); color:var(--rust); }
.tone-green{ background:var(--green-soft); color:var(--green); }
.kpi-val{ font-family:'Source Serif 4', serif; font-size:26px; font-weight:600; }
.kpi-label{ font-size:12px; color:var(--ink-faint); margin-top:2px; }
.kpi-progress{ height:4px; background:var(--line); margin-top:12px; border-radius:2px; overflow:hidden; }
.kpi-progress div{ height:100%; background:var(--rust); }

/* Panels */
.grid-2{ display:grid; grid-template-columns:1.3fr 1fr; gap:16px; }
.panel{ background:var(--paper-raised); border:1px solid var(--line); }
.panel-head{ display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid var(--line); }
.panel-head h3{ font-family:'IBM Plex Mono', monospace; font-size:11.5px; letter-spacing:0.08em; color:var(--ink-faint); font-weight:500; }
.panel-body{ padding:20px; }
.muted{ color:var(--ink-faint); font-size:13px; }

.stage-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.stage{ text-align:center; padding:14px 18px; background:var(--paper); border:1px solid var(--line); min-width:90px; }
.stage b{ display:block; font-family:'Source Serif 4', serif; font-size:20px; }
.stage span{ font-size:11px; color:var(--ink-faint); }
.stage-arrow{ color:var(--line-strong); flex:none; }

.quick-actions{ display:flex; flex-direction:column; gap:10px; }
.qa-btn{ display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid var(--line); background:var(--paper); border-radius:2px; font-size:13.5px; font-weight:500; color:var(--ink); }
.qa-btn:hover{ border-color:var(--rust); color:var(--rust); }

/* Buttons / forms */
.btn{ display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600; padding:10px 18px; border-radius:2px; border:1px solid var(--ink); background:transparent; }
.btn-primary{ background:var(--ink); color:#fff; border-color:var(--ink); }
.btn-primary:hover{ background:var(--ink-soft); }
.btn-primary:disabled{ cursor:not-allowed; }
.btn-outline{ color:var(--ink); border-color:var(--line-strong); }
.btn-outline:hover{ border-color:var(--ink); }
.btn-ghost{ border-color:transparent; color:var(--rust); padding:6px 10px; }
.btn-sm{ padding:8px 14px; font-size:12.5px; }
.btn-block{ width:100%; justify-content:center; }

.dropzone{ position:relative; border:1.5px dashed var(--line-strong); background:var(--paper); text-align:center; padding:38px 20px; margin-bottom:20px; display:flex; flex-direction:column; align-items:center; }
.dz-ico{ color:var(--rust); margin-bottom:10px; }
.dropzone b{ font-size:14.5px; margin-bottom:4px; }
.dropzone span{ font-size:12.5px; color:var(--ink-faint); }

.field{ margin-bottom:14px; }
.field label{ display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-faint); margin-bottom:6px; }
.field input,.field select{ width:100%; padding:9px 11px; border:1px solid var(--line-strong); background:#fff; border-radius:2px; font-size:13.5px; color:var(--ink); }
.field-row{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }

/* Table */
table{ width:100%; border-collapse:collapse; font-size:13.5px; }
th{ text-align:left; font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-faint); padding:8px 10px; border-bottom:1px solid var(--line); }
td{ padding:11px 10px; border-bottom:1px solid var(--line); }
.conf{ font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:12.5px; }
.conf.high{ color:var(--green); } .conf.mid{ color:#8A6D1E; } .conf.low{ color:var(--rust); }

.badge{ font-family:'IBM Plex Mono', monospace; font-size:11px; font-weight:600; padding:3px 9px; border-radius:2px; letter-spacing:0.03em; }
.badge-ink{ background:var(--navy-soft); color:var(--ink); }
.badge-rust{ background:var(--rust-soft); color:var(--rust); }
.badge-green{ background:var(--green-soft); color:var(--green); }
.badge-navy{ background:var(--ink); color:#fff; }

/* Pipeline / processing */
.pipe-section{ margin-bottom:22px; }
.pipe-section:last-child{ margin-bottom:0; }
.pipe-label{ display:flex; align-items:center; gap:6px; font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.08em; color:var(--ink-faint); margin-bottom:10px; }
.checklist{ display:flex; flex-direction:column; gap:8px; }
.check-step{ display:flex; align-items:center; gap:10px; font-size:13.5px; color:var(--ink-faint); }
.check-step.done{ color:var(--ink); }
.check-step.done .c-dot{ color:var(--green); }
.check-step.active{ color:var(--rust); }
.skeleton-lines{ display:flex; align-items:center; gap:8px; color:var(--ink-faint); font-size:13px; }
.ocr-block{ background:var(--paper); border:1px solid var(--line); padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
.ocr-line{ display:flex; justify-content:space-between; font-size:13px; }
.fields-table{ display:flex; flex-direction:column; }
.fields-row{ display:grid; grid-template-columns:1fr 1.3fr auto; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); align-items:center; font-size:13.5px; }
.fk{ color:var(--ink-faint); }

.empty-state{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:50px 20px; color:var(--ink-faint); text-align:center; }
.empty-state b{ color:var(--ink); font-size:14.5px; }

.timeline{ display:flex; flex-direction:column; gap:16px; }
.tl-item{ display:flex; gap:12px; }
.tl-dot{ width:8px; height:8px; border-radius:50%; background:var(--rust); margin-top:6px; flex:none; }
.tl-item b{ display:block; font-size:13.5px; font-weight:500; }
.tl-item span{ font-size:11.5px; color:var(--ink-faint); }

/* Modal */
.modal-overlay{ position:fixed; inset:0; background:rgba(27,42,65,0.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal{ background:#fff; width:100%; max-width:560px; max-height:88vh; overflow:auto; border-radius:2px; }
.modal-xwide{ max-width:940px; }
.modal-head{ display:flex; justify-content:space-between; align-items:flex-start; padding:20px 24px; border-bottom:1px solid var(--line); }
.modal-head h3{ font-size:17px; font-weight:600; }
.modal-head p{ margin:4px 0 0; font-size:12.5px; color:var(--ink-faint); }
.modal-close{ background:transparent; border:none; color:var(--ink-faint); }
.split{ display:grid; grid-template-columns:1fr 1fr; }
.doc-preview{ padding:22px; border-right:1px solid var(--line); background:var(--paper); }
.dp-page{ background:#fff; border:1px solid var(--line-strong); padding:20px; min-height:280px; position:relative; display:flex; flex-direction:column; gap:14px; }
.dp-line{ height:8px; background:var(--line); border-radius:2px; }
.dp-crop{ border:1.5px dashed var(--line-strong); padding:8px 10px; cursor:pointer; font-size:12px; background:var(--paper); }
.dp-crop.low{ border-color:var(--rust); background:var(--rust-soft); }
.dp-crop.focus{ border-color:var(--rust); box-shadow:0 0 0 2px var(--rust-soft); }
.dp-caption{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--ink-faint); margin-top:10px; }
.review-panel{ padding:22px; }
.section-title{ font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.08em; color:var(--ink-faint); text-transform:uppercase; margin-bottom:14px; }
.fields-list{ display:flex; flex-direction:column; gap:10px; }
.review-field{ border:1px solid var(--line); padding:11px 13px; }
.review-field.flagged{ border-color:var(--rust); background:var(--rust-soft); }
.review-field.active{ box-shadow:0 0 0 2px var(--rust-soft); }
.rf-top{ display:flex; justify-content:space-between; align-items:center; }
.rf-label{ font-size:12.5px; font-weight:600; }
.rf-value{ margin-top:6px; font-size:13.5px; cursor:pointer; }
.rf-ocr{ font-size:12px; color:var(--ink-faint); margin:8px 0 6px; }
.rf-input{ width:100%; padding:8px 10px; border:1px solid var(--line-strong); font-size:13.5px; margin-bottom:8px; }
.rf-actions{ display:flex; gap:8px; }

/* View Document */
.viewdoc-layout{ display:grid; grid-template-columns:260px 1fr; gap:18px; align-items:start; }
.viewdoc-list{ }
.vd-row{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--line); cursor:pointer; font-size:13px; }
.vd-row:hover{ background:var(--paper); }
.vd-row.active{ background:var(--rust-soft); }
.extract-card{ background:#fff; border:1px solid var(--line-strong); box-shadow:0 1px 2px rgba(27,42,65,0.06), 0 8px 24px rgba(27,42,65,0.05); position:relative; padding:26px 26px 22px; max-width:420px; }
.extract-card::before{ content:''; position:absolute; inset:7px; border:1px solid var(--line); pointer-events:none; }
.extract-head{ display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; margin-bottom:16px; border-bottom:1px dashed var(--line-strong); }
.extract-head .label{ font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.1em; color:var(--ink-faint); text-transform:uppercase; }
.extract-head .id{ font-family:'Source Serif 4', serif; font-size:17px; font-weight:600; margin-top:5px; }
.seal-mark{ width:52px; height:52px; border-radius:50%; border:1.5px solid var(--rust); display:flex; align-items:center; justify-content:center; color:var(--rust); font-family:'IBM Plex Mono', monospace; font-size:8.5px; text-align:center; }
.extract-row{ display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line); font-size:13.5px; }
.extract-row .k{ color:var(--ink-faint); }
.extract-row .v{ font-family:'IBM Plex Mono', monospace; font-weight:500; }
.status-chip{ display:inline-flex; align-items:center; gap:6px; background:var(--green-soft); color:var(--green); font-family:'IBM Plex Mono', monospace; font-size:11.5px; font-weight:600; padding:3px 9px; }
.status-chip::before{ content:''; width:5px; height:5px; border-radius:50%; background:var(--green); }
.extract-foot{ margin-top:18px; padding-top:14px; border-top:1px solid var(--line); font-family:'IBM Plex Mono', monospace; font-size:10.5px; color:var(--ink-faint); line-height:1.6; }

@media print{
  .no-print{ display:none !important; }
  .op-dash{ display:block; background:#fff; }
  .page{ padding:0; }
  .viewdoc-layout{ display:block; }
  .viewdoc-list{ display:none; }
}

@media (max-width:1100px){
  .kpi-grid{ grid-template-columns:repeat(3,1fr); }
  .grid-2{ grid-template-columns:1fr; }
  .split{ grid-template-columns:1fr; }
  .viewdoc-layout{ grid-template-columns:1fr; }
}
`;
