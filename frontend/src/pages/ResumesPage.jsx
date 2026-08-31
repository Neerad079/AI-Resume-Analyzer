import { useState, useEffect } from 'react';
import { resumeAPI } from '../api';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import './Resumes.css';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeAPI.list();
      setResumes(res.data || []);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setResumeText('');
    setIsDefault(resumes.length === 0);
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (r) => {
    setEditingId(r.id);
    setTitle(r.title);
    setResumeText(r.resumeText);
    setIsDefault(r.isDefault);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await resumeAPI.update(editingId, { title, resumeText, isDefault });
      } else {
        await resumeAPI.create({ title, resumeText, isDefault });
      }
      setShowModal(false);
      fetchResumes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save resume profile');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume profile?')) return;
    try {
      await resumeAPI.delete(id);
      fetchResumes();
    } catch {
      alert('Failed to delete resume');
    }
  };

  return (
    <div className="resumes-page animate-fade-in">
      <div className="page-header header-with-action">
        <div>
          <h1>
            <FileText size={24} className="header-icon" />
            My Resumes
          </h1>
          <p>Manage multiple resume profiles (e.g. Java Backend, React Frontend, Data Science).</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate} id="add-resume-btn">
          <Plus size={18} /> Add Resume Profile
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} strokeWidth={1} />
          <h3>No resume profiles yet</h3>
          <p>Create dedicated resume profiles for different job roles to quickly analyze JDs and generate outreach.</p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginTop: '1rem' }}>
            <Plus size={18} /> Create Your First Resume
          </button>
        </div>
      ) : (
        <div className="resumes-grid">
          {resumes.map((r) => (
            <div key={r.id} className={`resume-card ${r.isDefault ? 'is-default' : ''}`}>
              <div className="resume-card-header">
                <div className="title-group">
                  <h3>{r.title}</h3>
                  {r.isDefault && (
                    <span className="chip chip-success">
                      <Star size={12} fill="currentColor" /> Default Profile
                    </span>
                  )}
                </div>
                <div className="resume-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(r)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(r.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="resume-preview">
                {r.resumeText}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Resume Profile' : 'New Resume Profile'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="resume-title">Profile Title <span className="required">*</span></label>
                <input
                  id="resume-title"
                  className="form-input"
                  placeholder="e.g. Java Backend Engineer Resume"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Resume File (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="form-input"
                  style={{ padding: '0.4rem' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setError('');
                      const formData = new FormData();
                      formData.append('file', file);
                      if (!title) {
                        setTitle(file.name.replace(/\.[^/.]+$/, ""));
                      }
                      const res = await resumeAPI.parse(formData);
                      setResumeText(res.data.extractedText || '');
                    } catch (err) {
                      setError('Failed to extract text from file: ' + (err.response?.data?.error || err.message));
                    }
                  }}
                />
                <span className="form-help">Upload a PDF or DOCX file to automatically extract and populate resume text.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="resume-body">Resume Text <span className="required">*</span></label>
                <textarea
                  id="resume-body"
                  className="form-textarea"
                  placeholder="Extracted text or paste your full resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  required
                  rows={10}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  Set as default profile for single-click analysis
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
