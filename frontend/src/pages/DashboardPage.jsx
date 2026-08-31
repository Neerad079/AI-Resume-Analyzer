import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UploadCloud, FileSearch, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    navigate('/analyze');
  };

  return (
    <div className="dashboard-home animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        {/* Hero Section matching stitch_ai_resume_optimizer (4) */}
        <section className="hero-section hero-gradient" style={{ textAlign: 'center', padding: '4rem 1.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '890px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-badge" style={{ marginBottom: '1.5rem' }}>
              <span>AI-Powered Optimization</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: '3.25rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Beat the ATS.<br />Land the Interview.
            </h1>

            <p className="hero-subtitle" style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Stop guessing what hiring managers want. Our AI analyzes your resume against target job descriptions, uncovering missing keywords and formatting flaws instantly.
            </p>

            <div className="hero-cta-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-lg hero-btn" onClick={handleStartAnalysis} style={{ padding: '0.875rem 2rem', fontSize: '1rem', height: '48px' }}>
                <span>Analyze My Resume</span>
                <ArrowRight size={18} />
              </button>
              <p className="cta-note" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Social Proof Logos */}
        <section className="social-proof" style={{ padding: '2.5rem 1.5rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-lowest)', textAlign: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p className="social-proof-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
              Trusted by professionals hired at
            </p>
            <div className="logos-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '3rem', opacity: 0.7 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Google</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Microsoft</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Amazon</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Netflix</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Meta</span>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="how-it-works" style={{ padding: '4rem 1.5rem', background: 'var(--bg-surface-bright)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>How it Works</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Three simple steps to a perfectly tailored resume.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Step 1 */}
              <div className="step-card glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--border-color)' }}>
                  <UploadCloud size={26} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>1. Upload</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Upload your current resume in PDF or DOCX format. We support most standard layouts.</p>
              </div>

              {/* Step 2 */}
              <div className="step-card glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--border-color)' }}>
                  <FileSearch size={26} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>2. Analyze</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Paste the job description. Our AI compares your resume to the exact requirements.</p>
              </div>

              {/* Step 3 */}
              <div className="step-card glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--border-color)' }}>
                  <CheckCircle2 size={26} color="var(--color-secondary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>3. Optimize</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Get actionable suggestions to improve your match score and bypass ATS filters.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-low)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', display: 'block', marginBottom: '0.25rem' }}>HireIQ</span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>© 2026 HireIQ. Professional AI Resume Optimization.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
