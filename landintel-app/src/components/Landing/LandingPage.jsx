import React, { useState } from 'react';
import AuthModal from '../Auth/AuthModal';
import './Landing.css';

export default function LandingPage({ onLogin }) {
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [authRole, setAuthRole] = useState('citizen');

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenLogin = () => setAuthModal('login');
  const handleOpenRegister = (role = 'citizen') => {
    setAuthRole(role);
    setAuthModal('register');
  };

  const BrandMark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V10L12 4L20 10V20" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 20V14H15V20" stroke="white" strokeWidth="1.8" />
    </svg>
  );

  return (
    <div className="landing-theme">
      {/* ── Utility strip ── */}
      <div className="utility-bar">
        <div className="wrap">
          <div className="left"><span className="dot"></span> Digital Land Records Registry</div>
          <div className="right"><span>Districts Onboarded: 6</span><span>Help Center</span></div>
        </div>
      </div>

      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="wrap">
          <div className="brand">
            <div className="brand-mark">
              <BrandMark />
            </div>
            <div>
              <div className="brand-name">Land<em>Intel</em></div>
              <div className="brand-sub">Land Records Registry</div>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToId('home'); }}>Home</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); scrollToId('services'); }}>Services</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToId('about'); }}>About</a>
          </nav>
          <div className="nav-actions">
            <a href="#" className="link-btn" onClick={(e) => { e.preventDefault(); handleOpenLogin(); }}>Login</a>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenRegister('citizen')}>Register</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero" id="home">
        <div className="wrap">
          <div>
            <div className="eyebrow">Register No. LR-2026</div>
            <h1>A verified record<br />for every parcel<br />of <em>land.</em></h1>
            <p className="lead">LandIntel digitizes land documents and validates them against GIS parcel data, giving officers, field teams and citizens one verified register of truth.</p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => handleOpenRegister('citizen')}>Register an Account</button>
              <a href="#services" className="text-cta" onClick={(e) => { e.preventDefault(); scrollToId('services'); }}>View Services</a>
            </div>
          </div>

          {/* Extract card */}
          <div className="extract-card">
            <div className="extract-head">
              <div>
                <div className="label">Register Extract</div>
                <div className="id">Survey No. 125/2</div>
              </div>
              <div className="seal-mark">VERIFIED&nbsp;COPY</div>
            </div>
            <div className="extract-row"><span className="k">Village</span><span className="v">Village ABC</span></div>
            <div className="extract-row"><span className="k">District</span><span className="v">District 04</span></div>
            <div className="extract-row"><span className="k">Area</span><span className="v">2.4 Acres</span></div>
            <div className="extract-row"><span className="k">Status</span><span className="status-chip">Verified</span></div>
            <div className="extract-foot">
              Hash-chained · SHA-256 linked audit trail<br />
              Confidence score 96% · Issued by Registration Authority
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Services</div>
            <h2>One register, three roles</h2>
            <p>Each part of the land-record lifecycle sits in a single, access-controlled system.</p>
          </div>
          <div className="cards-3">
            <div className="svc-card">
              <span className="svc-tag">Role A</span>
              <h3>Field Digitization</h3>
              <p>Operators upload scanned deeds and registers. AI extracts owner, survey number, area and village fields for review.</p>
              <span className="svc-link" onClick={() => handleOpenRegister('operator')}>Join as Operator →</span>
            </div>
            <div className="svc-card">
              <span className="svc-tag">Role B</span>
              <h3>Official Verification</h3>
              <p>Registration Authorities check extracted data against the original document and approve records into the register.</p>
              <span className="svc-link" onClick={() => handleOpenRegister('registrar')}>Join as Authority →</span>
            </div>
            <div className="svc-card">
              <span className="svc-tag">Role C</span>
              <h3>Public Record Search</h3>
              <p>Citizens search verified parcels by district, taluk and village, and raise a request if a record looks wrong.</p>
              <span className="svc-link" onClick={() => handleOpenRegister('citizen')}>Search Records →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="section section-alt" id="about">
        <div className="wrap">
          <div className="about-grid">
            <div>
              <div className="eyebrow">About LandIntel</div>
              <h2>Closing the gap between paper archives and public trust.</h2>
              <p>Decades of handwritten and typed land records sit in fragile registers — hard to search and easy to dispute. LandIntel combines OCR and GIS georeferencing with human review, so every digitized record carries a clear, auditable chain of custody.</p>
              <div className="pillar-list">
                <div className="pillar">
                  <div className="num">01</div>
                  <div><b>AI Extraction</b><span>OCR pulls structured fields from scanned deeds and registers.</span></div>
                </div>
                <div className="pillar">
                  <div className="num">02</div>
                  <div><b>Human Verification</b><span>Operators and Registration Authorities check and approve every record.</span></div>
                </div>
                <div className="pillar">
                  <div className="num">03</div>
                  <div><b>Tamper-Evident Audit</b><span>Every change is hash-chained, timestamped and traceable.</span></div>
                </div>
              </div>
            </div>
            <div className="facts-panel">
              <div className="facts-title">Registry Facts</div>
              <div className="fact-row"><span>Encryption standard</span><b>AES-256-GCM</b></div>
              <div className="fact-row"><span>Audit chain</span><b>SHA-256 linked</b></div>
              <div className="fact-row"><span>Districts onboarded</span><b>6</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="wrap">
          <div>
            <div className="brand">
              <div className="brand-mark">
                <BrandMark />
              </div>
              <div className="brand-name">Land<em>Intel</em></div>
            </div>
            <p className="tag">An AI-assisted land record digitization, validation and public-access platform.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToId('home'); }}>Home</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToId('services'); }}>Services</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToId('about'); }}>About</a></li>
            </ul>
          </div>
          <div>
            <h4>Access</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleOpenLogin(); }}>Login</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleOpenRegister('citizen'); }}>Register</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href="#">support@landintel.gov</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 LandIntel · Digital Land Records Registry. All rights reserved.</div>
      </footer>

      {/* ── Auth Modal ── */}
      {authModal && (
        <AuthModal
          type={authModal}
          initialRole={authRole}
          onClose={() => setAuthModal(null)}
          onSwitch={(type) => setAuthModal(type)}
          onLogin={onLogin}
        />
      )}
    </div>
  );
}
