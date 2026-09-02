import { useState, useEffect } from 'react';
import { analysisAPI, historyAPI, resumeAPI, outreachAPI } from '../api';
import {
  FileSearch,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Save,
  RotateCcw,
  UploadCloud,
  Mail,
  Copy,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  Download,
  Key,
} from 'lucide-react';
import RewriteStudio from '../components/RewriteStudio';
import './Analyze.css';

export default function AnalyzePage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showRewriteStudio, setShowRewriteStudio] = useState(false);

  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [generatedOutreach, setGeneratedOutreach] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [outreachFormat, setOutreachFormat] = useState('linkedin'); // 'linkedin' | 'email'

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

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setError('');
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await resumeAPI.parse(formData);
      setResumeText(res.data.extractedText || '');
      setSelectedResumeId('custom');
    } catch (err) {
      setError('Failed to extract text from file: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setGeneratedOutreach(null);
    setLoading(true);
    setSaved(false);

    try {
      const res = await analysisAPI.match({
        jobDescription,
        resumeText,
        jobTitle,
        companyName,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOutreach = async () => {
    if (!jobDescription || !resumeText) return;
    setOutreachLoading(true);
    try {
      const res = await outreachAPI.generate({
        jobDescription,
        resumeText,
        jobTitle,
        companyName,
      });
      setGeneratedOutreach(res.data);
    } catch {
      setError('Failed to generate quick outreach');
    } finally {
      setOutreachLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    try {
      await historyAPI.save({
        jobTitle: jobTitle || 'Untitled Analysis',
        companyName,
        jobDescription,
        resumeText,
        matchScore: result.matchScore,
        gapReport: JSON.stringify(result.missingSkills),
        keywordSuggestions: JSON.stringify(result.keywordSuggestions),
        atsFlags: JSON.stringify(result.atsFlags),
        linkedinDm: generatedOutreach?.linkedinDm,
        coldEmail: generatedOutreach?.coldEmail,
      });
      setSaved(true);
    } catch {
      setError('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setResumeText('');
    setJobTitle('');
    setCompanyName('');
    setResult(null);
    setGeneratedOutreach(null);
    setError('');
    setSaved(false);
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Strong Match Potential';
    if (score >= 70) return 'Solid Keyword Alignment';
    if (score >= 50) return 'Moderate Match';
    if (score >= 30) return 'Weak Match';
    return 'Poor Match';
  };

  return (
    <div className="analyze-page animate-fade-in">
      <div className="page-header">
        <h1>
          <FileSearch size={24} className="header-icon" />
          Optimize Your Match
        </h1>
        <p>Upload your resume and provide the target job description. Our AI will analyze alignment and suggest strategic improvements.</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="analyze-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              className="form-input"
              placeholder="e.g. Senior Product Designer / Java Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="company-name">Company Name</label>
            <input
              id="company-name"
              className="form-input"
              placeholder="e.g. Google / Microsoft"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row textarea-row">
          <div className="form-group">
            <label className="form-label" htmlFor="job-description">
              Target Job Description <span className="required">*</span>
            </label>
            <textarea
              id="job-description"
              className="form-textarea"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              rows={9}
            />
          </div>

          <div className="form-group">
            <div className="label-with-selector">
              <label className="form-label" htmlFor="resume-text">
                Resume Content <span className="required">*</span>
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
                  <option value="custom">✏️ Custom Upload / Text</option>
                </select>
              )}
            </div>

            {/* Drag & Drop Dropzone from Stitch code.html */}
            <div
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <UploadCloud size={28} className="dropzone-icon" />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Upload Resume
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Drag and drop your PDF or DOCX file here, or click to browse.
              </span>
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </div>

            <textarea
              id="resume-text"
              className="form-textarea"
              placeholder="Or paste your plain text resume content here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              required
              rows={5}
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !jobDescription || !resumeText}
            id="analyze-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Analyzing alignment...
              </>
            ) : (
              <>
                Run Analysis
              </>
            )}
          </button>
          {result && (
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>Extracting keywords and analyzing semantic match...</p>
          <p className="loading-sub">Connecting to Gemini AI engine</p>
        </div>
      )}
      
      {/* Results Section */}
      {result && (
        <div className="analysis-results animate-slide-up">
          {/* Match Score Hero Card */}
          <div className="result-score-card">
            <div className={`score-ring ${getScoreClass(result.matchScore)}`}>
              <svg viewBox="0 0 120 120" className="score-svg">
                <circle cx="60" cy="60" r="52" className="score-bg-circle" />
                <circle
                  cx="60" cy="60" r="52"
                  className="score-progress-circle"
                  style={{
                    strokeDasharray: `${(result.matchScore / 100) * 327} 327`,
                  }}
                />
              </svg>
              <div className="score-number">{result.matchScore}</div>
            </div>
            <div className="score-info">
              <h2>{getScoreLabel(result.matchScore)}</h2>
              {/* Recommendation Badge */}
              {result.recommendation && (
                <span className={`chip ${
                  result.recommendation.includes('Strong') ? 'chip-success' :
                  result.recommendation.includes('Do Not') ? 'chip-error' : 'chip-info'
                }`} style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                  {result.recommendation}
                </span>
              )}
              {/* Fit Score bar */}
              {result.fitScore > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Recruiter Fit</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 9999, background: 'var(--bg-surface-container)' }}>
                    <div style={{ width: `${result.fitScore * 10}%`, height: '100%', borderRadius: 9999, background: result.fitScore >= 7 ? 'var(--color-secondary)' : result.fitScore >= 5 ? 'var(--color-tertiary)' : 'var(--color-error)', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '2rem' }}>{result.fitScore}/10</span>
                </div>
              )}
              {/* Honest Take */}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                {result.honestTake || result.summary || 'Analysis complete.'}
              </p>
            </div>

            <div className="score-actions">
              <button
                className="btn btn-accent btn-sm"
                onClick={() => setShowRewriteStudio(true)}
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                <Zap size={16} /> AI Resume Rewriter
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : <><Save size={16} /> Save</>}
              </button>
              {!generatedOutreach && (
                <button
                  className="btn btn-tertiary btn-sm"
                  onClick={handleQuickOutreach}
                  disabled={outreachLoading}
                >
                  {outreachLoading ? 'Drafting...' : <><Mail size={15} /> Draft Outreach</>}
                </button>
              )}
            </div>
          </div>

          {/* Recruiter Intel Grid — 2 columns */}
          <div className="result-details-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {result.mustFix && result.mustFix.length > 0 && (
              <div className="result-section">
                <div className="section-header">
                  <XCircle size={18} className="section-icon danger" />
                  <h3>Must Fix Before Applying</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.mustFix.map((item, i) => (
                    <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid var(--color-error)' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.strongAssets && result.strongAssets.length > 0 && (
              <div className="result-section">
                <div className="section-header">
                  <CheckCircle size={18} className="section-icon success" />
                  <h3>Your Strongest Assets</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.strongAssets.map((item, i) => (
                    <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid var(--color-secondary)' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.shouldFix && result.shouldFix.length > 0 && (
              <div className="result-section">
                <div className="section-header">
                  <Lightbulb size={18} className="section-icon warning" />
                  <h3>Should Fix (Raise Your Score)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.shouldFix.map((item, i) => (
                    <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid #f59e0b' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.coverLetterPriority && result.coverLetterPriority.length > 0 && (
              <div className="result-section">
                <div className="section-header">
                  <Mail size={18} className="section-icon info" />
                  <h3>Cover Letter Must-Hits</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.coverLetterPriority.map((item, i) => (
                    <div key={i} className="diff-box" style={{ padding: '0.625rem 0.75rem', borderLeft: '3px solid var(--color-tertiary)' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Keyword section + right column */}
          <div className="result-details-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div className="result-section">
              <div className="section-header">
                <Sparkles size={20} className="section-icon warning" />
                <h3>Keyword Injection Map</h3>
              </div>
              <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.keywordSuggestions && result.keywordSuggestions.length > 0 ? (
                  result.keywordSuggestions.map((kw, i) => (
                    <div key={i} className="diff-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--text-heading)' }}>Keyword #{i + 1}</strong>
                        <span className="chip chip-warning">Add to Resume</span>
                      </div>
                      <div className="diff-suggested">
                        <strong style={{ color: 'var(--accent)' }}>Insert:</strong> "{kw}"
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>All major keywords already present.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="result-section">
                <div className="section-header">
                  <Key size={18} className="section-icon danger" />
                  <h3>Missing Skills</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  ATS-critical phrases from the JD not found in your resume:
                </p>
                <div className="chips-container">
                  {result.missingSkills?.map((skill, i) => (
                    <span key={i} className="chip chip-danger">{skill}</span>
                  ))}
                  {(!result.missingSkills || result.missingSkills.length === 0) && (
                    <span className="chip chip-success">All core keywords matched!</span>
                  )}
                </div>
              </div>

              <div className="result-section">
                <div className="section-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={18} className="section-icon info" />
                    <h3>Outreach Draft</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className={`btn btn-xs ${outreachFormat === 'linkedin' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }} onClick={() => setOutreachFormat('linkedin')}>DM</button>
                    <button className={`btn btn-xs ${outreachFormat === 'email' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }} onClick={() => setOutreachFormat('email')}>Email</button>
                  </div>
                </div>
                {generatedOutreach ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.75rem', lineHeight: 1.5, maxHeight: '180px', overflowY: 'auto' }}>
                      {outreachFormat === 'linkedin' ? generatedOutreach.linkedinDm : generatedOutreach.coldEmail}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleCopy(outreachFormat === 'linkedin' ? generatedOutreach.linkedinDm : generatedOutreach.coldEmail, 'outreach')}>
                      {copiedKey === 'outreach' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Message</>}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-tertiary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleQuickOutreach} disabled={outreachLoading}>
                    {outreachLoading ? 'Generating...' : 'Draft Tailored Message'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRewriteStudio && (
        <RewriteStudio
          resumeText={resumeText}
          jobDescription={jobDescription}
          onClose={() => setShowRewriteStudio(false)}
        />
      )}
    </div>
  );
}
