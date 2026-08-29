import React, { useState } from 'react';

const ROLE_META = {
  citizen: { ico: '👤', label: 'Citizen' },
  operator: { ico: '🖥️', label: 'Operator' },
  registrar: { ico: '🏛️', label: 'Registration Authority' },
};

export default function AuthModal({ type, initialRole, onClose, onSwitch, onLogin }) {
  const [role, setRole] = useState(initialRole || 'citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const finalName = type === 'register' && name ? name : `${ROLE_META[role].label} User`;
    onLogin(role, finalName);
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{type === 'login' ? 'Welcome back' : 'Create your account'}</h3>
            <p>{type === 'login' ? 'Log in to your LandIntel account' : 'Choose your role to get the right dashboard'}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {type === 'login' && <div className="field"><label>I am logging in as</label></div>}
          <div className="role-picker">
            {Object.keys(ROLE_META).map((r) => (
              <button
                key={r}
                type="button"
                className={`role-pick ${role === r ? 'active' : ''}`}
                onClick={() => setRole(r)}
              >
                <div className="r-ico">{ROLE_META[r].ico}</div>
                <b>{ROLE_META[r].label}</b>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            {type === 'register' && (
              <div className="field">
                <label>Full name</label>
                <input type="text" required placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>Email address</label>
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {type === 'login' ? (
              <div className="field">
                <label>Password</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            ) : (
              <div className="field-row">
                <div className="field">
                  <label>Password</label>
                  <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="field">
                  <label>Confirm password</label>
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
            )}
            {error && <div className="err-text" style={{display: 'block', marginBottom: '10px'}}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-block">
              {type === 'login' ? `Login as ${ROLE_META[role].label} →` : `Register as ${ROLE_META[role].label} →`}
            </button>
          </form>
          <p className="form-hint">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(type === 'login' ? 'register' : 'login'); }}>
              {type === 'login' ? 'Register here' : 'Login here'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
