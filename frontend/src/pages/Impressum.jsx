import { useNavigate } from "react-router-dom";
import "./Privacy.css";

export default function Impressum() {
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
        <h1 className="legal-title serif">Impressum</h1>
        <p className="legal-subtitle text-muted">Legal Notice</p>
      </div>

      <div className="legal-sections">
        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 className="legal-card-title">Responsible Person</h2>
          <p>Tim Weirig</p>
          <p>14, Kr&auml;izhiel<br />8390 Nospelt<br />Luxembourg</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 className="legal-card-title">Contact</h2>
          <p>Email: <a href="mailto:hello@kernstudio.dev">hello@kernstudio.dev</a></p>
          <p>Phone: +352 621 400 654</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <h2 className="legal-card-title">Business Information</h2>
          <p>Operated by Kern Studio<br />Luxembourg Trade Register pending</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 className="legal-card-title">Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute resolution (ODR):{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>We are not obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
        </section>

        <section className="legal-card">
          <div className="legal-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="legal-card-title">Liability for Content</h2>
          <p>
            As a service provider, we are responsible for our own content on these pages in accordance with applicable Luxembourg and EU law. However, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances indicating illegal activity.
          </p>
          <p>
            Obligations to remove or block the use of information under general law remain unaffected. Liability in this respect is only possible from the point in time at which a concrete infringement of the law becomes known.
          </p>
        </section>
      </div>

      <p className="legal-footer-note text-muted">Last updated: March 2026</p>
    </main>
  );
}
