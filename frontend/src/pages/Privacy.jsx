import { useNavigate } from "react-router-dom";
import "./Privacy.css";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <main className="privacy-page">
      <nav className="page-back-header">
        <button className="privacy-back" onClick={() => navigate(-1)} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      </nav>

      <h1 className="privacy-title serif">Privacy Policy</h1>
      <p className="privacy-updated text-muted">Last updated: March 2026</p>

      <div className="privacy-sections">

        <section className="privacy-section">
          <h2 className="privacy-section-title">Who we are</h2>
          <p>Venn is a private couples app designed to help partners explore shared interests together. It is not affiliated with any third-party advertising or data broker.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">What data we collect</h2>
          <ul>
            <li><strong>Account info:</strong> your chosen username and a hashed password.</li>
            <li><strong>Pairing:</strong> a link between your account and your partner's account.</li>
            <li><strong>Swipe responses:</strong> your yes/no/maybe answers on catalog items, stored to calculate mutual matches.</li>
            <li><strong>Mood:</strong> the mood you optionally set, visible only to your partner and expiring automatically.</li>
          </ul>
          <p>We do not collect your real name, email address, phone number, location, or any device identifiers.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Cookies</h2>
          <p>We use a single session cookie (<code>kl_session</code>) strictly to keep you logged in. This cookie contains no tracking data, is never shared with third parties, and expires after 7 days of inactivity.</p>
          <p>No advertising cookies, analytics cookies, or third-party cookies are used.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Who can see your data</h2>
          <p>Your swipe responses and mood are shared only with your paired partner. No other users can see your data. We do not sell, rent, or share your data with any third party.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Data deletion</h2>
          <p>You can reset all swipe data and matches at any time from the Settings page (requires confirmation from both partners). To fully delete your account and all associated data, contact us.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Your rights (GDPR)</h2>
          <p>If you are based in the EU, you have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at the address below.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Contact</h2>
          <p>Questions about this policy? Reach us at <a href="mailto:hello@venn.lu">hello@venn.lu</a>.</p>
        </section>

      </div>
    </main>
  );
}