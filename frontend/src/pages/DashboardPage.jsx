import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, UploadCloud, FileSearch, CheckCircle2 } from 'lucide-react';
import DotGridBG from '../components/DotGridBG';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    navigate('/analyze');
  };

  return (
    <div
      className="dashboard-home"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        position: 'relative',
        padding: '0',
        width: '100%',
        background: 'transparent',
      }}
    >
      {/* Framer-style Dot Grid Animated Background covering the ENTIRE Dashboard Page */}
      <DotGridBG />

      <main style={{ flex: 1, position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Hero Section */}
        <section
          className="hero-section hero-section-relative"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
          }}
        >
          <div style={{ maxWidth: '890px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-badge hero-badge-anim" style={{ marginBottom: '1.5rem' }}>
              <span>AI-Powered Optimization</span>
            </div>

            <h1 className="hero-title hero-title-anim">
              <span className="gradient-text-anim">Beat the ATS.</span><br />
              <span>Land the Interview.</span>
            </h1>

            <p className="hero-subtitle hero-subtitle-anim">
              Stop guessing what hiring managers want. Our AI analyzes your resume against target job descriptions, uncovering missing keywords and formatting flaws instantly.
            </p>

            <div className="hero-cta-group hero-cta-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-lg hero-btn hero-btn-interactive" onClick={handleStartAnalysis} style={{ padding: '0.875rem 2.25rem', fontSize: '1.0625rem', height: '52px', borderRadius: 'var(--radius-md)' }}>
                <span>Analyze My Resume</span>
                <ArrowRight size={19} />
              </button>
              <p className="cta-note" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Social Proof Logos */}
        <section
          className="social-proof hero-section-relative"
          style={{
            padding: '2.5rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p className="social-proof-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
              Trusted by professionals hired at
            </p>
            <div className="logos-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '3.5rem', opacity: 0.75 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Google</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Microsoft</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Amazon</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Netflix</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>Meta</span>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="how-it-works hero-section-relative" style={{ padding: '4.5rem 1.5rem', background: 'transparent' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>How it Works</h2>
              <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)' }}>Three simple steps to a perfectly tailored resume.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Step 1 */}
              <div className="step-card glass-panel" style={{ padding: '2.25rem 2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--border-color)' }}>
                  <UploadCloud size={26} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>1. Upload</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Upload your current resume in PDF or DOCX format. We support most standard layouts.</p>
              </div>

              {/* Step 2 */}
              <div className="step-card glass-panel" style={{ padding: '2.25rem 2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--border-color)' }}>
                  <FileSearch size={26} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>2. Analyze</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Paste the job description. Our AI compares your resume to the exact requirements.</p>
              </div>

              {/* Step 3 */}
              <div className="step-card glass-panel" style={{ padding: '2.25rem 2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}>
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
      <footer style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(8px)', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
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
