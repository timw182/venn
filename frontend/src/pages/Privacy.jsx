import { useNavigate } from "react-router-dom";
import "./Privacy.css";

export default function Privacy() {
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
        <h1 className="legal-title serif">Privacy Policy</h1>
        <p className="legal-subtitle text-muted">Last updated: March 2026</p>
      </div>

      <div className="legal-sections">
        <section className="legal-card legal-card--highlight">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="legal-card-title">The short version</h2>
          <p>We collect the bare minimum to make Venn work. No real names, no emails, no tracking, no ads. Your swipe data is only ever shared with your paired partner.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <h2 className="legal-card-title">Who we are</h2>
          <p>Venn is a private couples app operated by Kern Studio from Luxembourg. It is designed to help partners explore shared interests together. We are not affiliated with any third-party advertising or data broker.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 className="legal-card-title">What data we collect</h2>
          <ul>
            <li><strong>Account info:</strong> your chosen username and a hashed password.</li>
            <li><strong>Pairing:</strong> a link between your account and your partner's account.</li>
            <li><strong>Swipe responses:</strong> your yes/no/maybe answers on catalog items, stored to calculate mutual matches.</li>
            <li><strong>Mood:</strong> the mood you optionally set, visible only to your partner and expiring automatically.</li>
          </ul>
          <p>We do <strong>not</strong> collect your real name, email address, phone number, location, or any device identifiers.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="legal-card-title">Cookies</h2>
          <p>We use a single session cookie (<code>vn_session</code>) strictly to keep you logged in. This cookie contains no tracking data, is never shared with third parties, and expires after 7 days of inactivity.</p>
          <p>No advertising cookies, analytics cookies, or third-party cookies are used.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h2 className="legal-card-title">Who can see your data</h2>
          <p>Your swipe responses and mood are shared <strong>only</strong> with your paired partner. No other users can see your data. We do not sell, rent, or share your data with any third party.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </div>
          <h2 className="legal-card-title">Data deletion</h2>
          <p>You can reset all swipe data and matches at any time from the Settings page (requires confirmation from both partners). To fully delete your account and all associated data, contact us.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h2 className="legal-card-title">Your rights (GDPR)</h2>
          <p>If you are based in the EU, you have the right to access, correct, export, or delete your personal data at any time. You also have the right to restrict processing and to object to data processing. To exercise these rights, contact us at the address below.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 className="legal-card-title">Contact</h2>
          <p>Questions about this policy? Reach us at <a href="mailto:hello@kernstudio.dev">hello@kernstudio.dev</a>.</p>
        </section>
      </div>

      <p className="legal-footer-note text-muted">Kern Studio &middot; Luxembourg</p>
    </main>
  );
}
