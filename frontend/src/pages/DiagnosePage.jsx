import { useState, useEffect } from 'react';
import { analysisAPI, resumeAPI } from '../api';
import {
  Stethoscope,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  UploadCloud,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import './DiagnosePage.css';

/* ── Grade color helper ── */
function keywordStatusClass(status) {
  if (status === 'Present') return 'chip-success';
  if (status === 'Weak')    return 'chip-warning';
  return 'chip-error';
}

function ScoreRing({ score, label, colorVar }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div className="dx-score-ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} className="dx-ring-bg" />
        <circle
          cx="48" cy="48" r={r}
          className="dx-ring-fg"
          style={{ strokeDasharray: `${dash} ${circ}`, stroke: `var(${colorVar})` }}
        />
      </svg>
      <div className="dx-ring-inner">
        <span className="dx-ring-num">{score}</span>
        <span className="dx-ring-denom">/10</span>
      </div>
      <p className="dx-ring-label">{label}</p>
    </div>
  );
}

function IssueRow({ icon: Icon, colorClass, title, items }) {
  const [open, setOpen] = useState(true);
  if (!items || items.length === 0) return null;
  return (
    <div className={`dx-issue-group ${colorClass}`}>
      <button className="dx-issue-header" onClick={() => setOpen(o => !o)}>
        <span className="dx-issue-header-left">
          <Icon size={16} />
          <strong>{title}</strong>
          <span className="dx-badge">{items.length}</span>
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <ul className="dx-issue-list">
          {items.map((item, i) => (
            <li key={i} className="dx-issue-item">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DiagnosePage() {
  const [resumeText, setResumeText]       = useState('');
  const [targetRole, setTargetRole]       = useState('');
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');
  const [dragActive, setDragActive]       = useState(false);
  const [savedResumes, setSavedResumes]   = useState([]);
  const [selectedId, setSelectedId]       = useState('');

  useEffect(() => {
    resumeAPI.list().then(res => {
      const list = res.data || [];
      setSavedResumes(list);
      const def = list.find(r => r.isDefault) || list[0];
      if (def) { setSelectedId(def.id); setResumeText(def.resumeText); }
    }).catch(() => {});
  }, []);

  const handleSelectResume = e => {
    const id = e.target.value;
    setSelectedId(id);
    if (id === 'custom') { setResumeText(''); }
    else {
      const found = savedResumes.find(r => String(r.id) === id);
      if (found) setResumeText(found.resumeText);
    }
  };

  const handleFileUpload = async file => {
    if (!file) return;
    try {
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      const res = await resumeAPI.parse(formData);
      setResumeText(res.data.extractedText || '');
      setSelectedId('custom');
    } catch (err) {
      setError('Failed to extract text: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDrag = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleDiagnose = async e => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await analysisAPI.diagnose({ resumeText, targetRole: targetRole || undefined });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Diagnosis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(''); };

  const signalColor = s => {
    if (s === 'Strong')               return 'chip-success';
    if (s === 'Moderate')             return 'chip-info';
    if (s === 'Critical Issues Found') return 'chip-error';
    return 'chip-warning';
  };

  return (
    <div className="dx-page animate-fade-in">
      <div className="page-header">
        <h1><Stethoscope size={24} className="header-icon" /> Resume Diagnosis</h1>
        <p>No job description needed — upload your resume and get an instant ATS parse simulation plus a brutal recruiter eye-scan. Discover what's killing your callback rate.</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleDiagnose} className="dx-form">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="dx-target-role">Target Role (optional)</label>
            <input
              id="dx-target-role"
              className="form-input"
              placeholder="e.g. Senior Backend Engineer, Product Manager..."
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
            />
          </div>
          {savedResumes.length > 0 && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Load Saved Resume</label>
              <select className="form-input resume-select" value={selectedId} onChange={handleSelectResume}>
                {savedResumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} {r.isDefault ? '(Default)' : ''}</option>
                ))}
                <option value="custom">Custom / Paste below</option>
              </select>
            </div>
          )}
        </div>

        {/* Dropzone */}
        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => document.getElementById('dx-file-input').click()}
        >
          <UploadCloud size={28} className="dropzone-icon" />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Drop PDF / DOCX here, or click to browse</p>
          <input id="dx-file-input" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files?.[0])} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="dx-resume-text">Or paste resume text <span className="required">*</span></label>
          <textarea
            id="dx-resume-text"
            className="form-textarea"
            rows={9}
            placeholder="Paste your resume content here..."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            required
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !resumeText} id="dx-submit">
            {loading
              ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Running diagnosis...</>
              : <><Stethoscope size={18} /> Diagnose Resume</>
            }
          </button>
          {result && (
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>
      </form>

      {/* Loading animation */}
      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>Simulating ATS parse engine...</p>
          <p className="loading-sub">Running recruiter eye-scan protocol</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="dx-results animate-slide-up">

          {/* Scores hero */}
          <div className="dx-scores-card glass-panel">
            <div className="dx-scores-header">
              <ScoreRing score={result.atsScore}       label="ATS Score"       colorVar="--color-tertiary" />
              <div className="dx-scores-divider" />
              <ScoreRing score={result.recruiterScore} label="Recruiter Score"  colorVar="--color-secondary" />
              <div className="dx-hirability">
                <p className="dx-hirability-label">Hire-ability Signal</p>
                <span className={`chip ${signalColor(result.hirabilitySignal)}`} style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>
                  {result.hirabilitySignal}
                </span>
              </div>
            </div>
          </div>

          {/* Issues accordion */}
          <div className="dx-issues-grid">
            <IssueRow
              icon={XCircle}
              colorClass="dx-critical"
              title="Critical Issues — Fix Before Applying Anywhere"
              items={result.criticalIssues}
            />
            <IssueRow
              icon={AlertTriangle}
              colorClass="dx-moderate"
              title="Moderate Issues — Fix This Week"
              items={result.moderateIssues}
            />
            <IssueRow
              icon={Info}
              colorClass="dx-minor"
              title="Minor Improvements — Polish Round"
              items={result.minorImprovements}
            />
          </div>

          {/* Two-column: keyword gaps + what's working */}
          <div className="dx-two-col">
            {/* Keyword gaps */}
            <div className="result-section">
              <div className="section-header">
                <Target size={18} className="section-icon warning" />
                <h3>Keyword Gap Analysis</h3>
              </div>
              <div className="chips-container" style={{ gap: '0.375rem' }}>
                {result.keywordGaps?.map((gap, i) => (
                  <span
                    key={i}
                    className={`chip ${keywordStatusClass(gap.status)}`}
                    title={gap.status}
                  >
                    {gap.keyword}
                    <span style={{ opacity: 0.6, marginLeft: 4, fontSize: '0.65rem' }}>
                      {gap.status === 'Present' ? '✓' : gap.status === 'Weak' ? '~' : '✗'}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* What's working + checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {result.whatIsWorking?.length > 0 && (
                <div className="result-section">
                  <div className="section-header">
                    <CheckCircle size={18} className="section-icon success" />
                    <h3>What's Working</h3>
                  </div>
                  <ul className="dx-strengths-list">
                    {result.whatIsWorking.map((s, i) => (
                      <li key={i}><CheckCircle size={13} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: 2 }} />{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.nextStepsChecklist?.length > 0 && (
                <div className="result-section">
                  <div className="section-header">
                    <TrendingUp size={18} className="section-icon info" />
                    <h3>Next Steps</h3>
                  </div>
                  <ul className="dx-checklist">
                    {result.nextStepsChecklist.map((step, i) => (
                      <li key={i}>
                        <span className="dx-step-num">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Top rewrites */}
          {result.topRewrites?.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <Zap size={18} className="section-icon warning" />
                <h3>Top 3 Highest-Impact Bullet Rewrites</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.topRewrites.map((rw, i) => (
                  <div key={i} className="diff-box">
                    <p className="diff-original"><strong>Original:</strong> {rw.original}</p>
                    <p className="diff-suggested"><strong>Rewritten:</strong> {rw.rewritten}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
