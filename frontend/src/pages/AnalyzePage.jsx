import { useState, useEffect } from 'react';
import { analysisAPI, historyAPI, resumeAPI } from '../api';
import {
  FileSearch,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Save,
  RotateCcw,
  Copy,
  Check,
  FileText,
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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
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
    setError('');
    setSaved(false);
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Strong Match';
    if (score >= 50) return 'Moderate Match';
    if (score >= 30) return 'Weak Match';
    return 'Poor Match';
  };

  return (
    <div className="analyze-page animate-fade-in">
      <div className="page-header">
        <h1>
          <FileSearch size={28} style={{ color: 'var(--accent-primary)' }} />
          Resume × JD Analyzer
        </h1>
        <p>Paste your resume and a job description to get an AI-powered match analysis.</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="analyze-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              className="form-input"
              placeholder="e.g. Frontend Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="company-name">Company Name</label>
            <input
              id="company-name"
              className="form-input"
              placeholder="e.g. Google"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row textarea-row">
          <div className="form-group">
            <label className="form-label" htmlFor="job-description">
              Job Description <span className="required">*</span>
            </label>
            <textarea
              id="job-description"
              className="form-textarea"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              rows={10}
            />
          </div>
          <div className="form-group">
            <div className="label-with-selector">
              <label className="form-label" htmlFor="resume-text">
                Resume <span className="required">*</span>
              </label>
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
            <textarea
              id="resume-text"
              className="form-textarea"
              placeholder="Upload a PDF/DOCX resume file above or paste your resume content here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              required
              rows={10}
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
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Match
              </>
            )}
          </button>
          {result && (
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              New Analysis
            </button>
          )}
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="analysis-loading">
          <div className="loading-pulse" />
          <p>AI is analyzing your resume against the job description...</p>
          <p className="loading-sub">This usually takes 5–8 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="analysis-results animate-slide-up">
          {/* Score Card */}
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
              <p>{result.summary}</p>
            </div>

            <div className="score-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saved ? (
                  <><Check size={16} /> Saved</>
                ) : saving ? (
                  'Saving...'
                ) : (
                  <><Save size={16} /> Save Analysis</>
                )}
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="result-details-grid">
            {/* Missing Skills */}
            <div className="result-section">
              <div className="section-header">
                <XCircle size={20} className="section-icon danger" />
                <h3>Missing Skills</h3>
              </div>
              <div className="chips-container">
                {result.missingSkills?.map((skill, i) => (
                  <span key={i} className="chip chip-danger">{skill}</span>
                ))}
                {(!result.missingSkills || result.missingSkills.length === 0) && (
                  <span className="chip chip-success">No gaps found! 🎉</span>
                )}
              </div>
            </div>

            {/* Keyword Suggestions */}
            <div className="result-section">
              <div className="section-header">
                <Lightbulb size={20} className="section-icon warning" />
                <h3>Keyword Suggestions</h3>
              </div>
              <div className="chips-container">
                {result.keywordSuggestions?.map((kw, i) => (
                  <span key={i} className="chip chip-info">{kw}</span>
                ))}
              </div>
            </div>

            {/* ATS Flags */}
            <div className="result-section">
              <div className="section-header">
                <AlertTriangle size={20} className="section-icon warning" />
                <h3>ATS Risk Flags</h3>
              </div>
              <ul className="ats-flags-list">
                {result.atsFlags?.map((flag, i) => (
                  <li key={i}>
                    <AlertTriangle size={14} />
                    {flag}
                  </li>
                ))}
                {(!result.atsFlags || result.atsFlags.length === 0) && (
                  <li className="flag-clear">
                    <CheckCircle size={14} />
                    No ATS issues detected
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
