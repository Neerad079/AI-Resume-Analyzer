import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  Mail,
  History,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <FileSearch size={28} />,
      title: 'Resume × JD Analyzer',
      description: 'Get AI-powered match scores, skills gap analysis, and ATS optimization tips.',
      link: '/analyze',
      color: '#6c5ce7',
    },
    {
      icon: <Mail size={28} />,
      title: 'Outreach Generator',
      description: 'Auto-draft LinkedIn DMs, cold emails, and cover letter blurbs personalized to each company.',
      link: '/outreach',
      color: '#00cec9',
    },
    {
      icon: <History size={28} />,
      title: 'Application History',
      description: 'Track your analyses, monitor score improvements, and revisit saved outreach messages.',
      link: '/history',
      color: '#e17055',
    },
  ];

  const stats = [
    { icon: <Target size={20} />, label: 'Match Accuracy', value: '95%', color: 'var(--success)' },
    { icon: <Zap size={20} />, label: 'Avg Response Time', value: '<8s', color: 'var(--warning)' },
    { icon: <TrendingUp size={20} />, label: 'Interview Rate ↑', value: '3.2×', color: 'var(--accent-primary)' },
  ];

  return (
    <div className="dashboard animate-fade-in">
      {/* Hero */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Career Intelligence</span>
          </div>
          <h1>
            Welcome back, <span className="gradient-text">{user?.fullName?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="hero-subtitle">
            Your AI career coach is ready. Analyze jobs, generate outreach, and land more interviews.
          </p>
        </div>

        <div className="hero-stats">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>What would you like to do?</h2>
        <div className="features-grid">
          {features.map((feature, i) => (
            <Link
              key={i}
              to={feature.link}
              className="feature-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="feature-icon"
                style={{ background: `${feature.color}15`, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-arrow">
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Tips */}
      <section className="tips-section">
        <div className="card-glass">
          <h3 style={{ marginBottom: '1rem' }}>💡 Pro Tips</h3>
          <div className="tips-grid">
            <div className="tip">
              <strong>Paste, don't upload</strong> — For fastest results, paste your resume as plain text. AI processes text faster than parsing PDFs.
            </div>
            <div className="tip">
              <strong>Be specific with JDs</strong> — Include the full job description, not just the title. More context = better analysis.
            </div>
            <div className="tip">
              <strong>Save everything</strong> — Use the History tab to track your progress. You'll be surprised how much your scores improve.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
