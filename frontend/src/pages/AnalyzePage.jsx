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

      {/* Results Section (matching Stitch code.html screen 2) */}
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
              <p>{result.summary || 'Your resume closely aligns with target role requirements. Implementing suggested keywords will maximize ATS parsing success.'}</p>
            </div>

            <div className="score-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saved ? (
                  <><Check size={16} /> Saved to History</>
                ) : saving ? (
                  'Saving...'
                ) : (
                  <><Save size={16} /> Save Analysis</>
                )}
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

          {/* Core Grid: Suggested Improvements + Side Utilities */}
          <div className="result-details-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Left Column: Suggested Improvements (Stitch Screen 2 centerpiece) */}
            <div className="result-section">
              <div className="section-header">
                <Sparkles size={20} className="section-icon warning" />
                <h3>Suggested Improvements</h3>
              </div>
              
              <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.keywordSuggestions && result.keywordSuggestions.length > 0 ? (
                  result.keywordSuggestions.map((kw, i) => (
                    <div key={i} className="diff-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--text-heading)' }}>
                          Target Key Area #{i + 1}
                        </strong>
                        <span className="chip chip-warning">High Impact</span>
                      </div>
                      <div className="diff-suggested">
                        <strong style={{ color: 'var(--accent)' }}>AI Optimization:</strong> "{kw}"
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="diff-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-heading)' }}>Action Item</strong>
                      <span className="chip chip-success">High Impact</span>
                    </div>
                    <p className="diff-original">Conducted tasks without quantitative outcomes.</p>
                    <p className="diff-suggested">
                      <strong>AI Suggestion:</strong> "Spearheaded key initiatives across target domains, directly improving project efficiency and delivery performance by 24%."
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Missing Keywords & Outreach */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Missing Keywords */}
              <div className="result-section">
                <div className="section-header">
                  <Key size={18} className="section-icon danger" />
                  <h3>Missing Keywords</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  The ATS is looking for these exact phrases from the job description:
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

              {/* Outreach Generator Card (from Stitch Screen 2) */}
              <div className="result-section">
                <div className="section-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={18} className="section-icon info" />
                    <h3>Outreach Draft</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className={`btn btn-xs ${outreachFormat === 'linkedin' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                      onClick={() => setOutreachFormat('linkedin')}
                    >
                      DM
                    </button>
                    <button
                      className={`btn btn-xs ${outreachFormat === 'email' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                      onClick={() => setOutreachFormat('email')}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {generatedOutreach ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      {outreachFormat === 'linkedin' ? generatedOutreach.linkedinDm : generatedOutreach.coldEmail}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleCopy(
                        outreachFormat === 'linkedin' ? generatedOutreach.linkedinDm : generatedOutreach.coldEmail,
                        'outreach'
                      )}
                    >
                      {copiedKey === 'outreach' ? <><Check size={14} /> Copied to Clipboard</> : <><Copy size={14} /> Copy Message</>}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-tertiary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleQuickOutreach}
                    disabled={outreachLoading}
                  >
                    {outreachLoading ? 'Generating message...' : 'Draft Tailored Message'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
