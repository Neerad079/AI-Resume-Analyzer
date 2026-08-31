import { useState, useEffect } from 'react';
import { outreachAPI, historyAPI, resumeAPI } from '../api';
import {
  Mail,
  Sparkles,
  MessageCircle,
  FileText,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Save,
} from 'lucide-react';
import './Outreach.css';

export default function OutreachPage() {
  const [companyName, setCompanyName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});
  const [saved, setSaved] = useState(false);

  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  useEffect(() => {
    resumeAPI.list().then((res) => {
      const list = res.data || [];
      setSavedResumes(list);
      const defaultProfile = list.find((r) => r.isDefault) || list[0];
      if (defaultProfile) {
        setSelectedResumeId(defaultProfile.id);
        setResumeText(defaultProfile.resumeText);
      }
    }).catch(() => {});
  }, []);

  const handleSelectResume = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    if (id === 'custom') {
      setResumeText('');
    } else {
      const found = savedResumes.find((r) => String(r.id) === String(id));
      if (found) setResumeText(found.resumeText);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    setSaved(false);

    try {
      const res = await outreachAPI.generate({
        companyName,
        targetRole,
        resumeText,
        jobDescription: jobDescription || undefined,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await historyAPI.save({
        jobTitle: targetRole,
        companyName,
        resumeText,
        jobDescription,
        linkedinDm: result.linkedinDm,
        coldEmail: `Subject: ${result.coldEmailSubject}\n\n${result.coldEmailBody}`,
        coverLetterBlurb: result.coverLetterBlurb,
      });
      setSaved(true);
    } catch {
      setError('Failed to save outreach');
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setTargetRole('');
    setResumeText('');
    setJobDescription('');
    setResult(null);
    setError('');
    setSaved(false);
  };

  return (
    <div className="outreach-page animate-fade-in">
      <div className="page-header">
        <h1>
          <Mail size={24} className="header-icon" />
          Outreach Generator
        </h1>
        <p>Generate personalized LinkedIn DMs, cold emails, and cover letter blurbs powered by AI.</p>
      </div>

      <form onSubmit={handleGenerate} className="outreach-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="out-company">Company Name <span className="required">*</span></label>
            <input id="out-company" className="form-input" placeholder="e.g. Razorpay" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="out-role">Target Role <span className="required">*</span></label>
            <input id="out-role" className="form-input" placeholder="e.g. Backend Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <div className="label-with-selector">
            <label className="form-label" htmlFor="out-resume">Resume <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>
                📤 Upload File (PDF/DOCX)
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setError('');
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await resumeAPI.parse(formData);
                      setResumeText(res.data.extractedText || '');
                      setSelectedResumeId('custom');
                    } catch (err) {
                      setError('Failed to extract text from file: ' + (err.response?.data?.error || err.message));
                    }
                  }}
                />
              </label>
              {savedResumes.length > 0 && (
                <select
                  className="resume-select"
                  value={selectedResumeId}
                  onChange={handleSelectResume}
                >
                  {savedResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      📁 {r.title} {r.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Text</option>
                </select>
              )}
            </div>
          </div>
          <textarea id="out-resume" className="form-textarea" placeholder="Upload a PDF/DOCX resume file above or paste your resume text..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} required rows={8} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="out-jd">Job Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — improves quality)</span></label>
          <textarea id="out-jd" className="form-textarea" placeholder="Paste JD for even more personalization..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !companyName || !targetRole || !resumeText} id="outreach-submit">
            {loading ? (
              <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Generating...</>
            ) : (
              <>Generate Outreach</>
            )}
          </button>
          {result && (
            <>
              <button type="button" className="btn btn-secondary" onClick={handleReset}><RotateCcw size={16} /> Reset</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saved}>
                {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}
              </button>
            </>
          )}
        </div>
      </form>

      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>AI is crafting personalized messages for {companyName}...</p>
          <p className="loading-sub">Researching company stack & tailoring content</p>
        </div>
      )}

      {result && (
        <div className="outreach-results animate-slide-up">
          {/* LinkedIn DM */}
          <div className="outreach-card">
            <div className="outreach-card-header">
              <div className="outreach-icon linkedin"><MessageCircle size={20} /></div>
              <div>
                <h3>LinkedIn DM</h3>
                <span className="char-count">{result.linkedinDm?.length || 0}/300 chars</span>
              </div>
              <button className="copy-btn" onClick={() => handleCopy('dm', result.linkedinDm)}>
                {copied.dm ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="outreach-content">{result.linkedinDm}</div>
          </div>

          {/* Cold Email */}
          <div className="outreach-card">
            <div className="outreach-card-header">
              <div className="outreach-icon email"><Mail size={20} /></div>
              <div>
                <h3>Cold Email</h3>
                <span className="email-subject">Subject: {result.coldEmailSubject}</span>
              </div>
              <button className="copy-btn" onClick={() => handleCopy('email', `Subject: ${result.coldEmailSubject}\n\n${result.coldEmailBody}`)}>
                {copied.email ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="outreach-content email-body">{result.coldEmailBody}</div>
          </div>

          {/* Cover Letter Blurb */}
          <div className="outreach-card">
            <div className="outreach-card-header">
              <div className="outreach-icon blurb"><BookOpen size={20} /></div>
              <div><h3>Cover Letter Blurb</h3></div>
              <button className="copy-btn" onClick={() => handleCopy('blurb', result.coverLetterBlurb)}>
                {copied.blurb ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="outreach-content">{result.coverLetterBlurb}</div>
          </div>
        </div>
      )}
    </div>
  );
}
