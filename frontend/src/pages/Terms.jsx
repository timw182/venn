import { useNavigate } from "react-router-dom";
import "./Privacy.css";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <main className="legal-page">
      <div className="legal-header">
        <nav className="legal-nav">
          <button className="legal-back" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </nav>
        <h1 className="legal-title serif">Terms of Service</h1>
        <p className="legal-subtitle text-muted">Last updated: March 2026</p>
      </div>

      <div className="legal-sections">
        <section className="legal-card legal-card--highlight">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h2 className="legal-card-title">The basics</h2>
          <p>By using Venn you agree to these terms. Venn is a private couples app for exploring shared interests together. Use it respectfully and honestly with your partner.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <h2 className="legal-card-title">Eligibility</h2>
          <p>You must be at least <strong>18 years old</strong> to use Venn. By creating an account you confirm that you meet this age requirement. We may terminate accounts that violate this rule.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="legal-card-title">Your account</h2>
          <ul>
            <li>You are responsible for keeping your login credentials secure.</li>
            <li>One account per person. Do not share your account.</li>
            <li>You may only pair with one partner at a time.</li>
            <li>Provide accurate information when creating your account.</li>
          </ul>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <h2 className="legal-card-title">Content guidelines</h2>
          <p>Venn is designed for use between consenting adult partners. By using the app you agree to:</p>
          <ul>
            <li>Only pair with a partner who has given their informed consent.</li>
            <li>Not use the platform to harass, pressure, or coerce anyone.</li>
            <li>Not attempt to extract or share your partner's private responses.</li>
            <li>Respect that matches represent mutual interest, not obligation.</li>
          </ul>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <h2 className="legal-card-title">Intellectual property</h2>
          <p>All content, design, code, and branding of Venn belong to Kern Studio. You may not copy, modify, distribute, or reverse-engineer any part of the app without written permission.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="legal-card-title">Limitation of liability</h2>
          <p>Venn is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to relationship outcomes, data loss, or service interruptions. Use Venn at your own discretion.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </div>
          <h2 className="legal-card-title">Termination</h2>
          <p>We may suspend or terminate your account if you violate these terms or use Venn in a way that harms others or the service. You can stop using Venn at any time by logging out. To delete your account and data, go to Settings → Delete Account.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <h2 className="legal-card-title">Governing law</h2>
          <p>These terms are governed by the laws of the <strong>Grand Duchy of Luxembourg</strong>. Any disputes will be resolved in the courts of Luxembourg City.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 className="legal-card-title">Contact</h2>
          <p>Questions about these terms? Reach us at <a href="mailto:hello@kernstudio.dev">hello@kernstudio.dev</a>.</p>
        </section>
      </div>

      <p className="legal-footer-note text-muted">Kern Studio &middot; Luxembourg</p>
    </main>
  );
}
