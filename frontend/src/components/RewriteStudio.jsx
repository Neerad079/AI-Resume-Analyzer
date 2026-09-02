import { useState, useEffect, useRef } from 'react';
import { analysisAPI } from '../api';
import {
  Sparkles,
  Download,
  X,
  CheckCircle,
  Edit3,
  Plus,
  Trash2,
  Zap,
  RotateCcw,
  Check
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './RewriteStudio.css';

export default function RewriteStudio({ resumeText, jobDescription, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    fetchRewrite();
  }, []);

  const fetchRewrite = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analysisAPI.rewrite({
        resumeText,
        jobDescription,
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rewrite resume with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfContainerRef.current) return;
    setDownloading(true);

    const element = pdfContainerRef.current;
    const opt = {
      margin: [10, 12, 10, 12],
      filename: `${(data?.fullName || 'Resume').replace(/\s+/g, '_')}_ATS_Optimized.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      })
      .catch((err) => {
        console.error('PDF Generation Error:', err);
        setDownloading(false);
      });
  };

  const handleUpdateSummary = (val) => {
    setData((prev) => ({ ...prev, summary: val }));
  };

  const handleUpdateBullet = (expIndex, bulletIndex, val) => {
    setData((prev) => {
      const newExp = [...prev.experiences];
      newExp[expIndex].bullets[bulletIndex] = val;
      return { ...prev, experiences: newExp };
    });
  };

  const handleAddBullet = (expIndex) => {
    setData((prev) => {
      const newExp = [...prev.experiences];
      newExp[expIndex].bullets.push('Quantified achievement highlighting technical leadership and impact...');
      return { ...prev, experiences: newExp };
    });
  };

  const handleRemoveBullet = (expIndex, bulletIndex) => {
    setData((prev) => {
      const newExp = [...prev.experiences];
      newExp[expIndex].bullets = newExp[expIndex].bullets.filter((_, i) => i !== bulletIndex);
      return { ...prev, experiences: newExp };
    });
  };

  return (
    <div className="rewrite-overlay animate-fade-in">
      <div className="rewrite-modal">
        {/* Top Control Bar */}
        <div className="rewrite-header">
          <div className="rewrite-header-title">
            <div className="rewrite-badge">
              <Zap size={16} /> AI Resume Rewriter Studio
            </div>
            {data && (
              <span className="boost-tag">
                <Sparkles size={14} /> Estimated ATS Score Boost: +{data.atsScoreBoost || 25}%
              </span>
            )}
          </div>

          <div className="rewrite-header-actions">
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={loading || downloading || !data}
            >
              {downloading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Generating ATS PDF...
                </>
              ) : downloadSuccess ? (
                <>
                  <Check size={16} /> PDF Downloaded!
                </>
              ) : (
                <>
                  <Download size={16} /> Download ATS PDF
                </>
              )}
            </button>
            <button className="btn btn-ghost icon-only" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Studio Content Body */}
        <div className="rewrite-body">
          {loading ? (
            <div className="rewrite-loading">
              <div className="loading-pulse" />
              <h3>Rewriting Bullet Points with STAR Method...</h3>
              <p>Analyzing job keywords and quantifying achievement impact metrics</p>
            </div>
          ) : error ? (
            <div className="rewrite-error">
              <p>{error}</p>
              <button className="btn btn-secondary btn-sm" onClick={fetchRewrite}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          ) : data ? (
            <div className="rewrite-split-view">
              {/* Sidebar: AI Infusion Highlights */}
              <div className="rewrite-sidebar">
                <div className="sidebar-block">
                  <h4><Sparkles size={14} className="accent-icon" /> Infused Job Keywords</h4>
                  <div className="infused-keywords">
                    {data.keywordsInfused?.map((kw, i) => (
                      <span key={i} className="kw-badge">
                        <CheckCircle size={12} /> {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sidebar-block">
                  <h4><Zap size={14} className="accent-icon" /> STAR Formula Applied</h4>
                  <p className="sidebar-desc">
                    Every work bullet point has been restructured into <strong>Situation/Task → Action → Result</strong> with quantified metric estimates.
                  </p>
                </div>
              </div>

              {/* Main Document Preview (This element is captured by html2pdf) */}
              <div className="pdf-preview-wrap">
                <div className="pdf-document" ref={pdfContainerRef}>
                  {/* Header */}
                  <div className="pdf-header">
                    <h1 className="pdf-name">{data.fullName || 'Alex Mercer'}</h1>
                    <p className="pdf-contact">{data.contactInfo || 'alex.mercer@email.com | +1 (555) 019-2834 | San Francisco, CA'}</p>
                  </div>

                  {/* Professional Summary */}
                  {data.summary && (
                    <div className="pdf-section">
                      <h2 className="pdf-section-title">PROFESSIONAL SUMMARY</h2>
                      <div className="pdf-summary-edit">
                        <textarea
                          className="pdf-textarea"
                          value={data.summary}
                          onChange={(e) => handleUpdateSummary(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Professional Experience */}
                  {data.experiences && data.experiences.length > 0 && (
                    <div className="pdf-section">
                      <h2 className="pdf-section-title">PROFESSIONAL EXPERIENCE</h2>
                      {data.experiences.map((exp, eIdx) => (
                        <div key={eIdx} className="pdf-exp-item">
                          <div className="pdf-exp-header">
                            <span className="pdf-exp-title">{exp.title}</span>
                            <span className="pdf-exp-company">{exp.company}</span>
                            <span className="pdf-exp-dates">{exp.dates}</span>
                          </div>
                          <ul className="pdf-bullets">
                            {exp.bullets?.map((b, bIdx) => (
                              <li key={bIdx} className="pdf-bullet-row">
                                <span className="bullet-dot">•</span>
                                <input
                                  className="pdf-bullet-input"
                                  value={b}
                                  onChange={(e) => handleUpdateBullet(eIdx, bIdx, e.target.value)}
                                />
                                <button
                                  className="bullet-remove-btn"
                                  title="Remove Bullet"
                                  onClick={() => handleRemoveBullet(eIdx, bIdx)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                          <button
                            className="add-bullet-btn"
                            onClick={() => handleAddBullet(eIdx)}
                          >
                            <Plus size={12} /> Add Optimized Bullet
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {data.skills && data.skills.length > 0 && (
                    <div className="pdf-section">
                      <h2 className="pdf-section-title">TECHNICAL SKILLS</h2>
                      <div className="pdf-skills-line">
                        <strong>Core Competencies: </strong>
                        {data.skills.join(' • ')}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {data.projects && data.projects.length > 0 && (
                    <div className="pdf-section">
                      <h2 className="pdf-section-title">PROJECTS</h2>
                      {data.projects.map((proj, pIdx) => (
                        <div key={pIdx} className="pdf-exp-item">
                          <div className="pdf-exp-header">
                            <span className="pdf-exp-title">{proj.name}</span>
                            <span className="pdf-exp-dates">{proj.techStack}</span>
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: '#334155', margin: '4px 0 6px 0' }}>{proj.description}</p>
                          {proj.bullets && (
                            <ul className="pdf-bullets">
                              {proj.bullets.map((pb, pbIdx) => (
                                <li key={pbIdx} className="pdf-bullet-row">
                                  <span className="bullet-dot">•</span>
                                  <span style={{ fontSize: '0.8125rem', color: '#1e293b' }}>{pb}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {data.education && data.education.length > 0 && (
                    <div className="pdf-section">
                      <h2 className="pdf-section-title">EDUCATION</h2>
                      {data.education.map((edu, edIdx) => (
                        <div key={edIdx} className="pdf-exp-header" style={{ marginBottom: '4px' }}>
                          <span className="pdf-exp-title">{edu.degree}</span>
                          <span className="pdf-exp-company">{edu.institution}</span>
                          <span className="pdf-exp-dates">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
