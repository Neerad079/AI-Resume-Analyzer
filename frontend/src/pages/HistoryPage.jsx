import { useState, useEffect } from 'react';
import { historyAPI } from '../api';
import {
  History,
  Trash2,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Stethoscope,
  PenLine,
  Mail,
  FileText,
  Check,
  CheckCircle,
  Info,
  Copy,
  AlertTriangle,
  XCircle,
  Star,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import './HistoryPage.css';

const TOOL_CONFIG = {
  RECRUITER_MATCH: {
    label: 'Recruiter Match',
    icon: FileSearch,
    badgeClass: 'tool-badge-match',
    color: '#6366f1',
  },
  DIAGNOSER: {
    label: 'Resume Diagnoser',
    icon: Stethoscope,
    badgeClass: 'tool-badge-diagnose',
    color: '#008ebf',
  },
  POLISH_BULLETS: {
    label: 'Polish Bullets',
    icon: PenLine,
    badgeClass: 'tool-badge-polish',
    color: '#006e2f',
  },
  OUTREACH: {
    label: 'Outreach Campaign',
    icon: Mail,
    badgeClass: 'tool-badge-outreach',
    color: '#f59e0b',
  },
};

const GRADE_CONFIG = {
  S: { label: 'S — Elite',    cls: 'grade-s' },
  A: { label: 'A — Strong',   cls: 'grade-a' },
  B: { label: 'B — Decent',   cls: 'grade-b' },
  C: { label: 'C — Weak',     cls: 'grade-c' },
  D: { label: 'D — Critical', cls: 'grade-d' },
};

export default function HistoryPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [filterTool, setFilterTool] = useState('ALL');
  const [expandedResultId, setExpandedResultId] = useState(null);
  const [showResumeSnippet, setShowResumeSnippet] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Legacy analysis_history support
  const [legacyItems, setLegacyItems] = useState([]);
  const [legacyPage, setLegacyPage] = useState(0);
  const [legacyTotalPages, setLegacyTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'legacy'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const [profilesRes, legacyRes] = await Promise.allSettled([
        historyAPI.getProfiles(),
        historyAPI.list(0, 10),
      ]);

      let userProfiles = [];
      if (profilesRes.status === 'fulfilled' && profilesRes.value?.data) {
        userProfiles = profilesRes.value.data;
        setProfiles(userProfiles);
      }

      let legacyList = [];
      if (legacyRes.status === 'fulfilled' && legacyRes.value?.data) {
        legacyList = legacyRes.value.data.content || [];
        setLegacyItems(legacyList);
        setLegacyTotalPages(legacyRes.value.data.totalPages || 0);
      }

      // Default active profile
      if (userProfiles.length > 0) {
        const defaultProfile = userProfiles.find((p) => p.isDefault) || userProfiles[0];
        setSelectedProfileId(defaultProfile.id);
        setActiveTab('profiles');
      } else if (legacyList.length > 0) {
        setActiveTab('legacy');
      }
    } catch {
      setError('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHistory();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeleteResult = async (resultId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved tool result?')) return;
    try {
      await historyAPI.deleteResult(resultId);
      // Refresh profiles history
      const res = await historyAPI.getProfiles();
      setProfiles(res.data || []);
    } catch {
      alert('Failed to delete tool result');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Delete this resume profile and ALL its saved tool results? This cannot be undone.')) return;
    try {
      await historyAPI.deleteProfile(profileId);
      const res = await historyAPI.getProfiles();
      const updated = res.data || [];
      setProfiles(updated);
      if (updated.length > 0) {
        setSelectedProfileId(updated[0].id);
      } else {
        setSelectedProfileId(null);
      }
    } catch {
      alert('Failed to delete profile');
    }
  };

  const handleDeleteLegacy = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await historyAPI.delete(id);
      const res = await historyAPI.list(legacyPage, 10);
      setLegacyItems(res.data.content || []);
      setLegacyTotalPages(res.data.totalPages || 0);
    } catch {
      alert('Failed to delete legacy analysis');
    }
  };

  const handleLegacyPageChange = async (newPage) => {
    try {
      const res = await historyAPI.list(newPage, 10);
      setLegacyItems(res.data.content || []);
      setLegacyTotalPages(res.data.totalPages || 0);
      setLegacyPage(newPage);
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeProfile = profiles.find((p) => p.id === selectedProfileId);

  const filteredResults = (activeProfile?.savedResults || []).filter((r) => {
    if (filterTool === 'ALL') return true;
    return r.toolType === filterTool;
  });

  // -------------------------------------------------------------
  // Tool Detail Renderers
  // -------------------------------------------------------------

  const renderRecruiterMatchDetails = (data) => {
    if (!data) return <p className="empty-inline">No result data stored.</p>;
    const missingSkills = data.missingSkills || data.gapReport || [];
    const keywords = data.matchedKeywords || data.keywordSuggestions || [];
    const atsFlags = data.atsFlags || [];
    const questions = data.interviewQuestions || [];

    return (
      <div className="tool-detail-content animate-fade-in">
        {/* Recruiter Fit Bar & Honest Take */}
        <div className="detail-hero-box glass-panel">
          <div className="detail-hero-top">
            <div>
              <span className="detail-label">Recruiter Fit Verdict</span>
              <p className="detail-verdict">{data.recommendation || data.verdict || 'Match Audit Complete'}</p>
            </div>
            {data.fitScore != null && (
              <div className="fit-pill">
                <span>Fit Score</span>
                <strong>{data.fitScore}/10</strong>
              </div>
            )}
          </div>
          <p className="detail-take">{data.honestTake || data.summary}</p>
        </div>

        {/* Must Fix Items */}
        {data.mustFix && data.mustFix.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title danger-title">
              <XCircle size={16} /> Must Fix Before Applying
            </h4>
            <div className="detail-bullet-list">
              {data.mustFix.map((item, i) => (
                <div key={i} className="bullet-row bullet-danger">
                  <span className="bullet-indicator" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong Assets */}
        {data.strongAssets && data.strongAssets.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title success-title">
              <CheckCircle size={16} /> Strongest Assets
            </h4>
            <div className="detail-bullet-list">
              {data.strongAssets.map((item, i) => (
                <div key={i} className="bullet-row bullet-success">
                  <span className="bullet-indicator" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Should Fix Items */}
        {data.shouldFix && data.shouldFix.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title warning-title">
              <AlertTriangle size={16} /> Should Fix
            </h4>
            <div className="detail-bullet-list">
              {data.shouldFix.map((item, i) => (
                <div key={i} className="bullet-row bullet-warning">
                  <span className="bullet-indicator" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cover Letter Priority */}
        {data.coverLetterPriority && data.coverLetterPriority.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title info-title">
              <Mail size={16} /> Cover Letter Priority
            </h4>
            <div className="detail-bullet-list">
              {data.coverLetterPriority.map((item, i) => (
                <div key={i} className="bullet-row bullet-info">
                  <span className="bullet-indicator" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title success-title">
              <Sparkles size={16} /> Actionable Quick Wins
            </h4>
            <div className="detail-bullet-list">
              {data.quickWins.map((win, i) => (
                <div key={i} className="bullet-row bullet-success">
                  <span className="bullet-indicator" />
                  <p>{win}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Keywords */}
        <div className="detail-grid-two">
          {missingSkills.length > 0 && (
            <div className="detail-box">
              <h4>Missing Target Skills</h4>
              <div className="chips-container">
                {missingSkills.map((s, i) => (
                  <span key={i} className="chip chip-danger">{s}</span>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="detail-box">
              <h4>Target JD Keywords</h4>
              <div className="chips-container">
                {keywords.map((k, i) => (
                  <span key={i} className="chip chip-info">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ATS Flags */}
        {atsFlags.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title warning-title">
              <AlertTriangle size={16} /> ATS Formatting Flags
            </h4>
            <div className="chips-container">
              {atsFlags.map((flag, i) => (
                <span key={i} className="chip chip-warning">{flag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Interview Questions */}
        {questions.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title">
              <Star size={16} /> High-Probability Interview Questions
            </h4>
            <div className="questions-list">
              {questions.map((q, i) => (
                <div key={i} className="q-item">
                  <span className="q-num">{i + 1}</span>
                  <p>{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Outreach if stored */}
        {data.outreach && (
          <div className="detail-section">
            <h4 className="section-title">
              <Mail size={16} /> Saved Outreach Messages
            </h4>
            {data.outreach.linkedinDm && (
              <div className="copy-card">
                <div className="copy-card-header">
                  <span>LinkedIn DM</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy(data.outreach.linkedinDm, 'outreach-dm')}
                  >
                    {copiedKey === 'outreach-dm' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <p className="copy-body">{data.outreach.linkedinDm}</p>
              </div>
            )}
            {data.outreach.coldEmail && (
              <div className="copy-card">
                <div className="copy-card-header">
                  <span>Cold Email</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy(data.outreach.coldEmail, 'outreach-email')}
                  >
                    {copiedKey === 'outreach-email' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <p className="copy-body">{data.outreach.coldEmail}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDiagnoserDetails = (data) => {
    if (!data) return <p className="empty-inline">No result data stored.</p>;

    return (
      <div className="tool-detail-content animate-fade-in">
        {/* Scores & Hirability Signal */}
        <div className="dx-summary-banner glass-panel">
          <div className="dx-summary-stat">
            <span className="dx-stat-num">{data.atsScore ?? '—'}/10</span>
            <span className="dx-stat-label">ATS Score</span>
          </div>
          <div className="dx-summary-divider" />
          <div className="dx-summary-stat">
            <span className="dx-stat-num">{data.recruiterScore ?? '—'}/10</span>
            <span className="dx-stat-label">Recruiter Score</span>
          </div>
          <div className="dx-summary-divider" />
          <div className="dx-summary-stat">
            <span className={`chip ${data.hirabilitySignal === 'Strong' ? 'chip-success' : 'chip-warning'}`}>
              {data.hirabilitySignal || 'Standard'}
            </span>
            <span className="dx-stat-label">Hire-ability Signal</span>
          </div>
        </div>

        {/* Critical Issues */}
        {data.criticalIssues && data.criticalIssues.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title danger-title">
              <XCircle size={16} /> Critical Issues & Fixes
            </h4>
            <div className="issues-stack">
              {data.criticalIssues.map((issue, i) => (
                <div key={i} className="issue-card issue-critical">
                  {typeof issue === 'string' ? (
                    <p className="issue-problem">{issue}</p>
                  ) : (
                    <>
                      <div className="issue-label-row">
                        <span className="issue-tag">{issue.severity || 'Critical'}</span>
                        <strong>{issue.label}</strong>
                      </div>
                      <p className="issue-problem">{issue.problem}</p>
                      {issue.fix && (
                        <div className="issue-fix">
                          <span className="fix-label">Recommended Fix:</span>
                          <p>{issue.fix}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderate Issues */}
        {data.moderateIssues && data.moderateIssues.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title warning-title">
              <AlertTriangle size={16} /> Moderate Issues
            </h4>
            <div className="issues-stack">
              {data.moderateIssues.map((issue, i) => (
                <div key={i} className="issue-card issue-warning">
                  {typeof issue === 'string' ? (
                    <p className="issue-problem">{issue}</p>
                  ) : (
                    <>
                      <div className="issue-label-row">
                        <span className="issue-tag warning-tag">{issue.severity || 'Moderate'}</span>
                        <strong>{issue.label}</strong>
                      </div>
                      <p className="issue-problem">{issue.problem}</p>
                      {issue.fix && (
                        <div className="issue-fix">
                          <span className="fix-label">Fix:</span>
                          <p>{issue.fix}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minor Improvements */}
        {data.minorImprovements && data.minorImprovements.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title info-title">
              <Info size={16} /> Minor Improvements
            </h4>
            <div className="issues-stack">
              {data.minorImprovements.map((issue, i) => (
                <div key={i} className="issue-card">
                  {typeof issue === 'string' ? (
                    <p className="issue-problem">{issue}</p>
                  ) : (
                    <>
                      <div className="issue-label-row">
                        <span className="issue-tag">{issue.severity || 'Minor'}</span>
                        <strong>{issue.label}</strong>
                      </div>
                      <p className="issue-problem">{issue.problem}</p>
                      {issue.fix && (
                        <div className="issue-fix">
                          <span className="fix-label">Fix:</span>
                          <p>{issue.fix}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Rewrites */}
        {data.topRewrites && data.topRewrites.length > 0 && (
          <div className="detail-section">
            <h4 className="section-title">
              <Sparkles size={16} /> Top Highest-Impact Rewrites
            </h4>
            <div className="rewrites-stack">
              {data.topRewrites.map((rw, i) => (
                <div key={i} className="rewrite-compare-card glass-panel">
                  <div className="rw-side rw-before">
                    <span className="rw-badge before-badge">Before</span>
                    <p>{rw.original || rw.before}</p>
                  </div>
                  <div className="rw-side rw-after">
                    <span className="rw-badge after-badge">X-Y-Z Formula After</span>
                    <p>{rw.rewritten || rw.after}</p>
                    {rw.whyItWorks && <p className="rw-why"><em>Why:</em> {rw.whyItWorks}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPolishBulletsDetails = (data) => {
    if (!data) return <p className="empty-inline">No result data stored.</p>;
    const bullets = data.triageResults || data.bullets || [];
    const derivedGrades = bullets.reduce((acc, b) => {
      if (b.grade) {
        const g = b.grade.toUpperCase();
        acc[g] = (acc[g] || 0) + 1;
      }
      return acc;
    }, {});
    const grades = data.gradeDistribution || derivedGrades;

    return (
      <div className="tool-detail-content animate-fade-in">
        {/* Bullets Summary */}
        <div className="bp-summary-banner glass-panel">
          <div className="bp-grade-hero">
            <span className="bp-grade-big">{data.overallBulletGrade || '—'}</span>
            <span className="bp-grade-sub">Avg Grade</span>
          </div>
          <div className="bp-grade-counts">
            {['S', 'A', 'B', 'C', 'D'].map((g) => (
              <div key={g} className="bp-grade-badge-col">
                <span className={`bp-pill ${GRADE_CONFIG[g]?.cls}`}>{g}</span>
                <span className="bp-count">{grades[g] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audited Bullets List */}
        <div className="detail-section">
          <h4 className="section-title">
            <PenLine size={16} /> Audited & X-Y-Z Formula Rewritten Bullets ({bullets.length})
          </h4>
          <div className="bullets-stack">
            {bullets.map((b, i) => (
              <div key={i} className="bullet-audit-card glass-panel">
                <div className="bullet-audit-header">
                  <span className={`chip ${GRADE_CONFIG[b.grade]?.cls}`}>
                    Grade {b.grade}
                  </span>
                  {b.powerVerbUsed && (
                    <span className="chip chip-info" style={{ fontSize: '0.75rem' }}>
                      Verb: {b.powerVerbUsed}
                    </span>
                  )}
                  {b.metricAdded && (
                    <span className="chip chip-success" style={{ fontSize: '0.75rem' }}>
                      Metric Added
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => handleCopy(b.rewritten || b.after, `bp-${i}`)}
                  >
                    {copiedKey === `bp-${i}` ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>

                <div className="bullet-row-original">
                  <span className="row-tag">Original:</span>
                  <p>{b.original || b.before}</p>
                </div>

                <div className="bullet-row-rewritten">
                  <span className="row-tag row-tag-polished">Polished:</span>
                  <p>{b.rewritten || b.after}</p>
                </div>

                {b.rationale && (
                  <p className="bullet-rationale">
                    <strong>Audit:</strong> {b.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Impact Summary */}
        {data.impactSummary && (
          <div className="detail-section">
            <h4 className="section-title">
              <Lightbulb size={16} /> Executive Impact Summary
            </h4>
            <div className="impact-box glass-panel">
              {data.impactSummary.strongestBullet && (
                <div className="impact-row">
                  <strong className="impact-lbl success">Strongest Bullet:</strong>
                  <p>{data.impactSummary.strongestBullet}</p>
                </div>
              )}
              {data.impactSummary.weakestBullet && (
                <div className="impact-row">
                  <strong className="impact-lbl danger">Weakest Bullet:</strong>
                  <p>{data.impactSummary.weakestBullet}</p>
                </div>
              )}
              {data.impactSummary.keyTakeaway && (
                <div className="impact-row">
                  <strong className="impact-lbl">Key Takeaway:</strong>
                  <p>{data.impactSummary.keyTakeaway}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOutreachDetails = (data) => {
    if (!data) return <p className="empty-inline">No result data stored.</p>;

    return (
      <div className="tool-detail-content animate-fade-in">
        {data.linkedinDm && (
          <div className="copy-card">
            <div className="copy-card-header">
              <span>LinkedIn DM</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCopy(data.linkedinDm, 'outreach-solo-dm')}
              >
                {copiedKey === 'outreach-solo-dm' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <p className="copy-body">{data.linkedinDm}</p>
          </div>
        )}

        {(data.coldEmailBody || data.coldEmail) && (
          <div className="copy-card">
            <div className="copy-card-header">
              <span>Cold Email</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCopy(`${data.coldEmailSubject ? `Subject: ${data.coldEmailSubject}\n\n` : ''}${data.coldEmailBody || data.coldEmail}`, 'outreach-solo-email')}
              >
                {copiedKey === 'outreach-solo-email' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            {data.coldEmailSubject && (
              <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
                Subject: {data.coldEmailSubject}
              </p>
            )}
            <p className="copy-body">{data.coldEmailBody || data.coldEmail}</p>
          </div>
        )}

        {data.coverLetterBlurb && (
          <div className="copy-card">
            <div className="copy-card-header">
              <span>Cover Letter Blurb</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCopy(data.coverLetterBlurb, 'outreach-solo-blurb')}
              >
                {copiedKey === 'outreach-solo-blurb' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <p className="copy-body">{data.coverLetterBlurb}</p>
          </div>
        )}
      </div>
    );
  };

  const renderToolResultDetails = (result) => {
    switch (result.toolType) {
      case 'RECRUITER_MATCH':
        return renderRecruiterMatchDetails(result.resultData);
      case 'DIAGNOSER':
        return renderDiagnoserDetails(result.resultData);
      case 'POLISH_BULLETS':
        return renderPolishBulletsDetails(result.resultData);
      case 'OUTREACH':
        return renderOutreachDetails(result.resultData);
      default:
        return (
          <pre className="detail-raw-json">
            {JSON.stringify(result.resultData, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="history-page animate-fade-in">
      <div className="page-header header-with-action">
        <div>
          <h1>
            <History size={26} className="header-icon" />
            Saved History & Profiles
          </h1>
          <p>Consolidated analysis results organized under unified resume profiles across all devices.</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="history-tab-group">
          <button
            className={`tab-btn ${activeTab === 'profiles' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            <FileText size={16} /> Resume Profiles ({profiles.length})
          </button>
          {legacyItems.length > 0 && (
            <button
              className={`tab-btn ${activeTab === 'legacy' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('legacy')}
            >
              <History size={16} /> Legacy Runs ({legacyItems.length})
            </button>
          )}
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Syncing saved history from server...</p>
        </div>
      ) : activeTab === 'profiles' ? (
        profiles.length === 0 ? (
          <div className="empty-state">
            <History size={48} strokeWidth={1} />
            <h3>No Resume Profiles Found</h3>
            <p>Run Recruiter Match, Diagnoser, or Polish Bullets and click "Save to Profile" to build your consolidated history.</p>
          </div>
        ) : (
          <div className="history-layout">
            {/* Left sidebar: Resume Profiles selector */}
            <aside className="profile-selector-sidebar">
              <div className="sidebar-header">
                <h3>Resume Profiles</h3>
                <span className="profile-count-pill">{profiles.length}</span>
              </div>

              <div className="profile-cards-list">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  const toolsPresent = Array.from(new Set((p.savedResults || []).map((r) => r.toolType)));

                  return (
                    <div
                      key={p.id}
                      className={`profile-card ${isSelected ? 'profile-card-selected' : ''}`}
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        setFilterTool('ALL');
                        setExpandedResultId(null);
                      }}
                    >
                      <div className="profile-card-top">
                        <h4 className="profile-title">{p.title}</h4>
                        {p.isDefault && <span className="default-badge">Default</span>}
                      </div>

                      <div className="profile-card-meta">
                        <span><Calendar size={13} /> {formatDate(p.updatedAt || p.createdAt)}</span>
                        <span>•</span>
                        <span><strong>{p.savedResultsCount}</strong> saved tool {p.savedResultsCount === 1 ? 'run' : 'runs'}</span>
                      </div>

                      {toolsPresent.length > 0 && (
                        <div className="profile-tool-pills">
                          {toolsPresent.map((t) => {
                            const cfg = TOOL_CONFIG[t] || { label: t, badgeClass: 'tool-badge-generic' };
                            return (
                              <span key={t} className={`mini-tool-pill ${cfg.badgeClass}`}>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Right main area: Selected Profile Workspace */}
            <section className="profile-workspace">
              {activeProfile ? (
                <>
                  {/* Profile Header Details */}
                  <div className="workspace-profile-header glass-panel">
                    <div className="workspace-header-info">
                      <div className="workspace-title-row">
                        <h2>{activeProfile.title}</h2>
                        {activeProfile.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <p className="workspace-date">
                        Created {formatDate(activeProfile.createdAt)} • Last updated {formatDate(activeProfile.updatedAt)}
                      </p>
                    </div>

                    <div className="workspace-header-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowResumeSnippet(!showResumeSnippet)}
                        title="View Resume Text"
                      >
                        <FileText size={15} /> {showResumeSnippet ? 'Hide Resume Text' : 'View Resume Text'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProfile(activeProfile.id)}
                        title="Delete Profile & All Results"
                      >
                        <Trash2 size={15} /> Delete Profile
                      </button>
                    </div>

                    {showResumeSnippet && (
                      <div className="resume-snippet-box animate-fade-in">
                        <div className="snippet-box-header">
                          <span>Stored Resume Text</span>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCopy(activeProfile.resumeText, 'profile-resume-text')}
                          >
                            {copiedKey === 'profile-resume-text' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Text</>}
                          </button>
                        </div>
                        <pre className="snippet-text">{activeProfile.resumeText}</pre>
                      </div>
                    )}
                  </div>

                  {/* Tool Filter Bar */}
                  <div className="tool-filters-row">
                    <button
                      className={`filter-pill ${filterTool === 'ALL' ? 'filter-pill-active' : ''}`}
                      onClick={() => setFilterTool('ALL')}
                    >
                      All Results ({activeProfile.savedResults?.length || 0})
                    </button>
                    {['RECRUITER_MATCH', 'DIAGNOSER', 'POLISH_BULLETS', 'OUTREACH'].map((t) => {
                      const count = (activeProfile.savedResults || []).filter((r) => r.toolType === t).length;
                      const cfg = TOOL_CONFIG[t] || { label: t };
                      return (
                        <button
                          key={t}
                          className={`filter-pill ${filterTool === t ? 'filter-pill-active' : ''}`}
                          onClick={() => setFilterTool(t)}
                        >
                          {cfg.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Results List for this Profile */}
                  {filteredResults.length === 0 ? (
                    <div className="empty-profile-results glass-panel">
                      <History size={40} strokeWidth={1.5} color="var(--text-muted)" />
                      <h3>No results saved under this filter</h3>
                      <p>Run your analysis in Recruiter Match, Diagnoser, or Polish Bullets and click "Save to Profile".</p>
                    </div>
                  ) : (
                    <div className="saved-results-stack">
                      {filteredResults.map((result) => {
                        const toolCfg = TOOL_CONFIG[result.toolType] || {
                          label: result.toolType,
                          icon: FileText,
                          badgeClass: 'tool-badge-generic',
                        };
                        const Icon = toolCfg.icon;
                        const isExpanded = expandedResultId === result.id;

                        return (
                          <div
                            key={result.id}
                            className={`saved-result-item ${isExpanded ? 'expanded' : ''}`}
                          >
                            <div
                              className="saved-result-header"
                              onClick={() => setExpandedResultId(isExpanded ? null : result.id)}
                            >
                              <div className="result-header-left">
                                <div className={`tool-type-icon ${toolCfg.badgeClass}`}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <div className="result-title-row">
                                    <h3 className="result-tool-name">{toolCfg.label}</h3>
                                    {result.jobTitle && (
                                      <span className="result-target-role">
                                        • {result.jobTitle}
                                      </span>
                                    )}
                                    {result.companyName && (
                                      <span className="result-company">
                                        <Building2 size={13} /> {result.companyName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="result-timestamp">
                                    <Calendar size={13} /> Saved on {formatDate(result.createdAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="result-header-right">
                                {result.score != null && (
                                  <div className="result-mini-score">
                                    <span>Score</span>
                                    <strong>{result.score}</strong>
                                  </div>
                                )}
                                <button
                                  className="btn btn-danger btn-icon btn-sm"
                                  onClick={(e) => handleDeleteResult(result.id, e)}
                                  title="Delete saved result"
                                >
                                  <Trash2 size={15} />
                                </button>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>

                            {/* Expanded Original Result Content */}
                            {isExpanded && (
                              <div className="saved-result-body animate-fade-in">
                                {renderToolResultDetails(result)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>Select a resume profile on the left to view saved analysis results.</p>
                </div>
              )}
            </section>
          </div>
        )
      ) : (
        /* Legacy History View */
        <div className="legacy-history-view">
          <div className="legacy-banner">
            <History size={18} />
            <span>Legacy analyses saved prior to resume profiles are listed below.</span>
          </div>

          <div className="history-list">
            {legacyItems.map((item) => (
              <div
                key={item.id}
                className={`history-item ${expandedResultId === item.id ? 'expanded' : ''}`}
              >
                <div
                  className="history-item-header"
                  onClick={() => setExpandedResultId(expandedResultId === item.id ? null : item.id)}
                >
                  <div className="history-meta">
                    {item.matchScore != null && (
                      <div className="mini-score score-high">
                        {item.matchScore}
                      </div>
                    )}
                    <div>
                      <h3 className="history-title">{item.jobTitle || 'Legacy Analysis'}</h3>
                      <div className="history-sub">
                        {item.companyName && (
                          <span><Building2 size={13} /> {item.companyName}</span>
                        )}
                        <span><Calendar size={13} /> {formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="history-actions">
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteLegacy(item.id); }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronDown size={18} className={`expand-icon ${expandedResultId === item.id ? 'rotated' : ''}`} />
                  </div>
                </div>

                {expandedResultId === item.id && (
                  <div className="history-details animate-fade-in">
                    {item.gapReport && (
                      <div className="detail-section">
                        <h4>Missing Skills</h4>
                        <div className="chips-container">
                          {(() => {
                            try {
                              const parsed = JSON.parse(item.gapReport);
                              return Array.isArray(parsed) ? parsed.map((s, i) => <span key={i} className="chip chip-danger">{s}</span>) : <span>{item.gapReport}</span>;
                            } catch {
                              return <span>{item.gapReport}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {item.keywordSuggestions && (
                      <div className="detail-section">
                        <h4>Keywords</h4>
                        <div className="chips-container">
                          {(() => {
                            try {
                              const parsed = JSON.parse(item.keywordSuggestions);
                              return Array.isArray(parsed) ? parsed.map((k, i) => <span key={i} className="chip chip-info">{k}</span>) : <span>{item.keywordSuggestions}</span>;
                            } catch {
                              return <span>{item.keywordSuggestions}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {item.linkedinDm && (
                      <div className="detail-section">
                        <h4>LinkedIn DM</h4>
                        <p className="detail-text">{item.linkedinDm}</p>
                      </div>
                    )}
                    {item.coldEmail && (
                      <div className="detail-section">
                        <h4>Cold Email</h4>
                        <p className="detail-text">{item.coldEmail}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {legacyTotalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={legacyPage === 0}
                onClick={() => handleLegacyPageChange(legacyPage - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="page-info">
                Page {legacyPage + 1} of {legacyTotalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={legacyPage >= legacyTotalPages - 1}
                onClick={() => handleLegacyPageChange(legacyPage + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
