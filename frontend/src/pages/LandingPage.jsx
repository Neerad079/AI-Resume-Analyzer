import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UploadCloud, FileSearch, CheckCircle2 } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-page">
      {/* Top Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={() => navigate('/')}>
            <span className="brand-text">HireIQ</span>
          </div>

          <nav className="landing-links">
            <Link to="/dashboard" className="landing-link">Dashboard</Link>
            <Link to="/history" className="landing-link">History</Link>
            <Link to="/analyze" className="landing-link">Analyze</Link>
          </nav>

          <div className="landing-actions">
            {user ? (
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Log In</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main>
        {/* Hero Section */}
        <section className="hero-section hero-gradient">
          <div className="hero-content">
            <div className="hero-badge">
              <span>AI-Powered Optimization</span>
            </div>

            <h1 className="hero-title">
              Beat the ATS.<br />Land the Interview.
            </h1>

            <p className="hero-subtitle">
              Stop guessing what hiring managers want. Our AI analyzes your resume against target job descriptions, uncovering missing keywords and formatting flaws instantly.
            </p>

            <div className="hero-cta-group">
              <button className="btn btn-primary btn-lg hero-btn" onClick={handleStart}>
                <span>Analyze My Resume</span>
                <ArrowRight size={18} />
              </button>
              <p className="cta-note">No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Social Proof Logos */}
        <section className="social-proof">
          <div className="social-proof-inner">
            <p className="social-proof-label">Trusted by professionals hired at</p>
            <div className="logos-grid">
              <span className="logo-item">Google</span>
              <span className="logo-item">Microsoft</span>
              <span className="logo-item">Amazon</span>
              <span className="logo-item">Netflix</span>
              <span className="logo-item">Meta</span>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="how-it-works">
          <div className="how-it-works-inner">
            <div className="section-title-group">
              <h2>How it Works</h2>
              <p>Three simple steps to a perfectly tailored resume.</p>
            </div>

            <div className="steps-grid">
              {/* Step 1 */}
              <div className="step-card glass-panel">
                <div className="step-icon-wrapper">
                  <UploadCloud size={24} color="var(--color-primary)" />
                </div>
                <h3>1. Upload</h3>
                <p>Upload your current resume in PDF or DOCX format. We support most standard layouts.</p>
              </div>

              {/* Step 2 */}
              <div className="step-card glass-panel">
                <div className="step-icon-wrapper">
                  <FileSearch size={24} color="var(--color-primary)" />
                </div>
                <h3>2. Analyze</h3>
                <p>Paste the job description. Our AI compares your resume to the exact requirements.</p>
              </div>

              {/* Step 3 */}
              <div className="step-card glass-panel">
                <div className="step-icon-wrapper">
                  <CheckCircle2 size={24} color="var(--color-secondary)" />
                </div>
                <h3>3. Optimize</h3>
                <p>Get actionable suggestions to improve your match score and bypass ATS filters.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer-container">
        <div className="footer-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>HireIQ</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>© 2026 HireIQ. Professional AI Resume Optimization.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
