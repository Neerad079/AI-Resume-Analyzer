import { useState, useEffect } from 'react';
import { historyAPI } from '../api';
import {
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import './HistoryPage.css';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchHistory = async (p = 0) => {
    setLoading(true);
    try {
      const res = await historyAPI.list(p, 10);
      setItems(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setPage(p);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await historyAPI.delete(id);
      fetchHistory(page);
    } catch {
      alert('Failed to delete');
    }
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const parseJson = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str ? [str] : [];
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page animate-fade-in">
      <div className="page-header">
        <h1>
          <History size={28} style={{ color: '#e17055' }} />
          Application History
        </h1>
        <p>Track your analyses and outreach messages over time.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading history...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <History size={48} strokeWidth={1} />
          <h3>No analyses saved yet</h3>
          <p>Use the Analyzer or Outreach Generator and save your results to see them here.</p>
        </div>
      ) : (
        <>
          <div className="history-list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`history-item ${expanded === item.id ? 'expanded' : ''}`}
              >
                <div
                  className="history-item-header"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="history-meta">
                    {item.matchScore != null && (
                      <div className={`mini-score ${getScoreClass(item.matchScore)}`}>
                        {item.matchScore}
                      </div>
                    )}
                    <div>
                      <h3 className="history-title">{item.jobTitle || 'Untitled'}</h3>
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ExternalLink
                      size={16}
                      className={`expand-icon ${expanded === item.id ? 'rotated' : ''}`}
                    />
                  </div>
                </div>

                {expanded === item.id && (
                  <div className="history-details animate-fade-in">
                    {item.gapReport && (
                      <div className="detail-section">
                        <h4>Missing Skills</h4>
                        <div className="chips-container">
                          {parseJson(item.gapReport).map((s, i) => (
                            <span key={i} className="chip chip-danger">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.keywordSuggestions && (
                      <div className="detail-section">
                        <h4>Keywords</h4>
                        <div className="chips-container">
                          {parseJson(item.keywordSuggestions).map((k, i) => (
                            <span key={i} className="chip chip-info">{k}</span>
                          ))}
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
                    {item.coverLetterBlurb && (
                      <div className="detail-section">
                        <h4>Cover Letter Blurb</h4>
                        <p className="detail-text">{item.coverLetterBlurb}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => fetchHistory(page - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="page-info">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => fetchHistory(page + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
