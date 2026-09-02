import { useState, useEffect } from 'react';
import { analysisAPI, resumeAPI } from '../api';
import {
  FlameKindling, UploadCloud, RotateCcw, ShieldAlert, ShieldCheck,
  HelpCircle, Star, ChevronDown, ChevronUp, BookOpen, Target,
  AlertTriangle, MessageCircle, Lightbulb,
} from 'lucide-react';
import './InterviewPrepPage.css';

const CATEGORY_COLORS = {
  'Achievement Verification': { cls: 'ip-cat-achieve', icon: Star },
  'Gap Probe':                { cls: 'ip-cat-gap',     icon: AlertTriangle },
  'Depth Drill':              { cls: 'ip-cat-depth',   icon: Target },
  'Failure Probe':            { cls: 'ip-cat-fail',    icon: ShieldAlert },
  'Culture Fit':              { cls: 'ip-cat-culture', icon: MessageCircle },
  'Trap Question':            { cls: 'ip-cat-trap',    icon: HelpCircle },
};

function riskColor(r) {
  if (r === 'Low') return 'chip-success';
  if (r === 'Medium') return 'chip-info';
  if (r === 'High') return 'chip-warning';
  return 'chip-error';
}

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_COLORS[q.category] || { cls: 'ip-cat-default', icon: HelpCircle };
  const Icon = meta.icon;
  return (
    <div className={`ip-q-card ${meta.cls}`}>
      <button className="ip-q-header" onClick={() => setOpen(o => !o)}>
        <span className="ip-q-num">{index + 1}</span>
        <span className="ip-q-category"><Icon size={13} />{q.category}</span>
        <span className="ip-q-text">{q.question}</span>
        {open ? <ChevronUp size={15} className="ip-q-chevron" /> : <ChevronDown size={15} className="ip-q-chevron" />}
      </button>
      {open && (
        <div className="ip-q-detail">
          {q.whyAsked   && <div className="ip-q-row"><span className="ip-q-row-label">Why asked</span><p>{q.whyAsked}</p></div>}
          {q.weakAnswer && <div className="ip-q-row ip-row-weak"><span className="ip-q-row-label">Weak answer</span><p>{q.weakAnswer}</p></div>}
          {q.strongAnswer && <div className="ip-q-row ip-row-strong"><span className="ip-q-row-label">Strong answer</span><p>{q.strongAnswer}</p></div>}
        </div>
      )}
    </div>
  );
}

function DefenseCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ip-def-card">
      <button className="ip-def-header" onClick={() => setOpen(o => !o)}>
        <Lightbulb size={14} /><span>{d.threat}</span>
        {open ? <ChevronUp size={14} className="ip-def-chevron" /> : <ChevronDown size={14} className="ip-def-chevron" />}
      </button>
      {open && (
        <div className="ip-def-body">
          {d.leadWith    && <div className="ip-def-row"><span className="ip-def-label lead">Lead with</span><p>{d.leadWith}</p></div>}
          {d.supportWith && <div className="ip-def-row"><span className="ip-def-label support">Support with</span><p>{d.supportWith}</p></div>}
          {d.defuseWith  && <div className="ip-def-row"><span className="ip-def-label defuse">Defuse with</span><p>{d.defuseWith}</p></div>}
          {d.closeWith   && <div className="ip-def-row"><span className="ip-def-label close">Close with</span><p>{d.closeWith}</p></div>}
        </div>
      )}
    </div>
  );
}

export default function InterviewPrepPage() {
  const [resumeText, setResumeText]       = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');
  const [dragActive, setDragActive]       = useState(false);
  const [savedResumes, setSavedResumes]   = useState([]);
  const [selectedId, setSelectedId]       = useState('');
  const [activeTab, setActiveTab]         = useState('brief');

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
    e.preventDefault(); setError(''); setResult(null); setLoading(true); setActiveTab('brief');
    try {
      const res = await analysisAPI.interviewPrep({ resumeText, jobDescription, targetCompany: targetCompany || undefined });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Interview prep failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="ip-page animate-fade-in">
      <div className="page-header">
        <h1><FlameKindling size={24} className="header-icon" /> Interview Prep</h1>
        <p>The Hiring Manager stress-tests your resume. Get the full interrogation brief — every hard question, why it's asked, and exactly how to answer without flinching.</p>
      </div>

      <form onSubmit={handleSubmit} className="ip-form">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="ip-company">Target Company (optional)</label>
            <input id="ip-company" className="form-input" placeholder="e.g. Google, Stripe..." value={targetCompany} onChange={e => setTargetCompany(e.target.value)} />
          </div>
          {savedResumes.length > 0 && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Load Saved Resume</label>
              <select className="form-input" value={selectedId} onChange={handleSelectResume}>
                {savedResumes.map(r => <option key={r.id} value={r.id}>{r.title}{r.isDefault ? ' (Default)' : ''}</option>)}
                <option value="custom">Custom / Paste</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-row" style={{ gap: '1.25rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="ip-jd">Job Description <span className="required">*</span></label>
            <textarea id="ip-jd" className="form-textarea" rows={9} placeholder="Paste the full job description..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <div className="form-label" style={{ marginBottom: '0.5rem' }}>Resume <span className="required">*</span></div>
            <div className={`dropzone ${dragActive ? 'active' : ''}`} style={{ minHeight: 90 }} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById('ip-file').click()}>
              <UploadCloud size={22} className="dropzone-icon" />
              <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Drop PDF/DOCX or click to browse</p>
              <input id="ip-file" type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files?.[0])} />
            </div>
            <textarea className="form-textarea" rows={4} placeholder="Or paste resume text..." value={resumeText} onChange={e => setResumeText(e.target.value)} required style={{ marginTop: '0.5rem' }} />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !resumeText || !jobDescription} id="ip-submit">
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Building brief...</> : <><FlameKindling size={18} /> Generate Interview Prep</>}
          </button>
          {result && <button type="button" className="btn btn-outline" onClick={() => { setResult(null); setError(''); }}><RotateCcw size={16} /> Reset</button>}
        </div>
      </form>

      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>Running hiring manager stress-test protocol...</p>
          <p className="loading-sub">Identifying credibility threats and building defense frameworks</p>
        </div>
      )}

      {result && (
        <div className="ip-results animate-slide-up">
          {/* Dossier header */}
          <div className="ip-dossier-card glass-panel">
            <div className="ip-dossier-left">
              <div className="ip-confidence">
                <span className="ip-conf-num">{result.confidenceToHireScore}</span>
                <span className="ip-conf-denom">/10</span>
                <span className="ip-conf-label">Confidence to Hire</span>
              </div>
            </div>
            <div className="ip-dossier-right">
              <span className={`chip ${riskColor(result.riskClassification)}`} style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>
                {result.riskClassification} Risk
              </span>
              {result.primaryConcern && (
                <p className="ip-primary-concern"><ShieldAlert size={15} style={{ flexShrink: 0 }} />{result.primaryConcern}</p>
              )}
            </div>
          </div>

          {result.fortressStrengths?.length > 0 && (
            <div className="result-section">
              <div className="section-header"><ShieldCheck size={18} className="section-icon success" /><h3>Fortress Strengths</h3></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.fortressStrengths.map((s, i) => <span key={i} className="chip chip-success">{s}</span>)}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="ip-tabs">
            {[
              { id: 'brief',   label: 'Interrogation Brief', icon: BookOpen,    count: result.interrogationBrief?.length },
              { id: 'defense', label: 'Defense Coaching',    icon: ShieldCheck, count: result.coachingDefense?.length },
              { id: 'threats', label: 'Credibility Threats', icon: ShieldAlert, count: result.credibilityThreats?.length },
            ].map(tab => (
              <button key={tab.id} className={`ip-tab ${activeTab === tab.id ? 'ip-tab-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <tab.icon size={15} />{tab.label}
                {tab.count > 0 && <span className="ip-tab-badge">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'brief' && (
            <div className="ip-question-list">
              <p className="ip-section-intro">Expand each question to see why it's asked and what separates a weak answer from a strong one.</p>
              {result.interrogationBrief?.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
            </div>
          )}

          {activeTab === 'defense' && (
            <div className="ip-defense-list">
              <p className="ip-section-intro">4-part defense structure for each credibility threat: lead, support, defuse, close.</p>
              {result.coachingDefense?.map((d, i) => <DefenseCard key={i} d={d} />)}
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="ip-threats-list">
              <p className="ip-section-intro">Claims that won't survive direct questioning without preparation.</p>
              {result.credibilityThreats?.map((t, i) => (
                <div key={i} className="ip-threat-card">
                  <div className="ip-threat-claim"><ShieldAlert size={14} /><strong>{t.claim}</strong></div>
                  {t.whyItsThreat && <p className="ip-threat-why">{t.whyItsThreat}</p>}
                  {t.whatToSay && <div className="ip-threat-say"><span className="ip-def-label support">What to say</span><p>{t.whatToSay}</p></div>}
                </div>
              ))}
              {result.softSpots?.length > 0 && (
                <div className="result-section" style={{ marginTop: '1rem' }}>
                  <div className="section-header"><AlertTriangle size={16} className="section-icon warning" /><h3>Soft Spots</h3></div>
                  {result.softSpots.map((s, i) => <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid #f59e0b', marginBottom: '0.5rem' }}><p style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{s}</p></div>)}
                </div>
              )}
              {result.cultureFitConcerns?.length > 0 && (
                <div className="result-section" style={{ marginTop: '1rem' }}>
                  <div className="section-header"><MessageCircle size={16} className="section-icon info" /><h3>Culture Fit Concerns</h3></div>
                  {result.cultureFitConcerns.map((c, i) => <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid var(--color-tertiary)', marginBottom: '0.5rem' }}><p style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{c}</p></div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
