import { useState, useEffect } from 'react';
import { analysisAPI, resumeAPI } from '../api';
import {
  PenLine, UploadCloud, RotateCcw, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, Zap, Copy, Check
} from 'lucide-react';
import './BulletPolishPage.css';

const GRADE_CONFIG = {
  S: { label: 'S — Elite',    cls: 'grade-s', desc: 'Publish as-is.' },
  A: { label: 'A — Strong',   cls: 'grade-a', desc: 'Minor polish only.' },
  B: { label: 'B — Decent',   cls: 'grade-b', desc: 'Rewrite recommended.' },
  C: { label: 'C — Weak',     cls: 'grade-c', desc: 'Must rewrite.' },
  D: { label: 'D — Critical', cls: 'grade-d', desc: 'Delete or completely rebuild.' },
};

function GradeBar({ grades }) {
  const total = Object.values(grades).reduce((a, b) => a + b, 0);
  if (!total) return null;
  return (
    <div className="bp-grade-bar">
      {['S', 'A', 'B', 'C', 'D'].map(g => {
        const count = grades[g] || 0;
        const pct = total ? (count / total * 100).toFixed(0) : 0;
        return count > 0 ? (
          <div key={g} className={`bp-grade-seg ${GRADE_CONFIG[g].cls}`} style={{ width: `${pct}%` }} title={`${GRADE_CONFIG[g].label}: ${count}`}>
            {count}
          </div>
        ) : null;
      })}
    </div>
  );
}

function BulletCard({ bullet, onCopy, copied }) {
  const [open, setOpen] = useState(false);
  const cfg = GRADE_CONFIG[bullet.grade] || GRADE_CONFIG.C;
  // backend field is 'problem' (from BulletAnalysis DTO)
  const issueText = bullet.problem || bullet.issue;
  return (
    <div className={`bp-bullet-card ${cfg.cls}`}>
      <div className="bp-bullet-header" onClick={() => setOpen(o => !o)}>
        <span className={`bp-grade-badge ${cfg.cls}`}>{bullet.grade}</span>
        <span className="bp-bullet-original">{bullet.original}</span>
        <span className="bp-grade-desc">{cfg.desc}</span>
      </div>
      {open && (
        <div className="bp-bullet-detail">
          {issueText && (
            <div className="bp-detail-row bp-row-issue">
              <AlertTriangle size={13} />
              <p><strong>Issue:</strong> {issueText}</p>
            </div>
          )}
          {bullet.rewritten && (
            <div className="bp-detail-row bp-row-rewrite">
              <TrendingUp size={13} />
              <div style={{ flex: 1 }}>
                <p><strong>Rewritten:</strong> {bullet.rewritten}</p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.625rem' }}
                  onClick={() => onCopy(bullet.rewritten, bullet.original)}
                >
                  {copied === bullet.original ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          )}
          {bullet.xyzFormula && (
            <div className="bp-detail-row bp-row-xyz">
              <Zap size={13} />
              <p><strong>X-Y-Z Formula:</strong> {bullet.xyzFormula}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BulletPolishPage() {
  const [resumeText, setResumeText]         = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState('');
  const [dragActive, setDragActive]         = useState(false);
  const [savedResumes, setSavedResumes]     = useState([]);
  const [selectedId, setSelectedId]         = useState('');
  const [copiedBullet, setCopiedBullet]     = useState(null);
  const [filterGrade, setFilterGrade]       = useState('all');

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
    if (id === 'custom') setResumeText('');
    else {
      const found = savedResumes.find(r => String(r.id) === id);
      if (found) setResumeText(found.resumeText);
    }
  };

  const handleFileUpload = async file => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await resumeAPI.parse(formData);
      setResumeText(res.data.extractedText || '');
      setSelectedId('custom');
    } catch (err) {
      setError('Failed to extract: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDrag = e => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = e => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setResult(null); setLoading(true); setFilterGrade('all');
    try {
      const res = await analysisAPI.rewriteBullets({ resumeText, jobDescription: jobDescription || undefined });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Polish failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedBullet(key);
    setTimeout(() => setCopiedBullet(null), 2000);
  };

  // Backend returns 'triageResults' (BulletRewriteResponse.triageResults)
  const bullets = result?.triageResults || [];
  const grades = bullets.reduce((acc, b) => { acc[b.grade] = (acc[b.grade] || 0) + 1; return acc; }, {});
  const displayed = filterGrade === 'all' ? bullets : bullets.filter(b => b.grade === filterGrade);

  return (
    <div className="bp-page animate-fade-in">
      <div className="page-header">
        <h1><PenLine size={24} className="header-icon" /> Bullet Polish Studio</h1>
        <p>The Rewriter audits every bullet on your resume using the X-Y-Z formula and grades each D → S. Expand any bullet to get the rewritten version ready to paste.</p>
      </div>

      <form onSubmit={handleSubmit} className="bp-form">
        <div className="form-row">
          {savedResumes.length > 0 && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Load Saved Resume</label>
              <select className="form-input" value={selectedId} onChange={handleSelectResume}>
                {savedResumes.map(r => <option key={r.id} value={r.id}>{r.title}{r.isDefault ? ' (Default)' : ''}</option>)}
                <option value="custom">Custom / Paste</option>
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="bp-jd">Job Description (optional — improves keyword targeting)</label>
            <input id="bp-jd" className="form-input" placeholder="Paste JD URL or key requirements..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
          </div>
        </div>

        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => document.getElementById('bp-file').click()}
        >
          <UploadCloud size={28} className="dropzone-icon" />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Drop PDF/DOCX or click to browse</p>
          <input id="bp-file" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files?.[0])} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bp-text">Or paste resume text <span className="required">*</span></label>
          <textarea id="bp-text" className="form-textarea" rows={9} placeholder="Paste your resume content here..." value={resumeText} onChange={e => setResumeText(e.target.value)} required />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !resumeText} id="bp-submit">
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Auditing bullets...</> : <><PenLine size={18} /> Polish My Bullets</>}
          </button>
          {result && <button type="button" className="btn btn-outline" onClick={() => { setResult(null); setError(''); }}><RotateCcw size={16} /> Reset</button>}
        </div>
      </form>

      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>Applying X-Y-Z formula to every bullet...</p>
          <p className="loading-sub">Grading and rewriting for maximum impact</p>
        </div>
      )}

      {result && (
        <div className="bp-results animate-slide-up">
          {/* Score header */}
          <div className="bp-summary-card glass-panel">
            <div className="bp-summary-left">
              <div className="bp-avg-grade">
                <span className="bp-avg-num">{result.overallBulletGrade || '—'}</span>
                <span className="bp-avg-label">Avg Grade</span>
              </div>
            </div>
            <div className="bp-summary-right">
              <div className="bp-stats">
                {['D', 'C', 'B', 'A', 'S'].map(g => (grades[g] > 0) && (
                  <div key={g} className="bp-stat-item">
                    <span className={`bp-stat-grade ${GRADE_CONFIG[g].cls}`}>{g}</span>
                    <span className="bp-stat-count">{grades[g]}</span>
                  </div>
                ))}
              </div>
              <GradeBar grades={grades} />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="bp-filters">
            <button className={`chip ${filterGrade === 'all' ? 'bp-filter-active' : ''}`} onClick={() => setFilterGrade('all')}>
              All ({bullets.length})
            </button>
            {['D', 'C', 'B', 'A', 'S'].map(g => grades[g] > 0 && (
              <button key={g} className={`chip ${GRADE_CONFIG[g].cls} ${filterGrade === g ? 'bp-filter-active' : ''}`} onClick={() => setFilterGrade(g)}>
                {g} — {GRADE_CONFIG[g].label.split(' — ')[1]} ({grades[g]})
              </button>
            ))}
          </div>

          {/* Bullet list */}
          <div className="bp-bullet-list">
            {result.criticalSummary && (
              <div className="diff-box" style={{ borderLeft: '3px solid var(--color-error)', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  <strong>Critical Summary:</strong> {result.criticalSummary}
                </p>
              </div>
            )}
            {displayed.map((b, i) => (
              <BulletCard key={i} bullet={b} onCopy={handleCopy} copied={copiedBullet} />
            ))}
            {displayed.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No bullets match this filter.</p>
            )}
          </div>

          {result.topPriorityActions?.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <CheckCircle size={18} className="section-icon success" />
                <h3>Top Priority Actions</h3>
              </div>
              <ol className="bp-priority-list">
                {result.topPriorityActions.map((a, i) => (
                  <li key={i}>
                    <span className="bp-pri-num">{i + 1}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
