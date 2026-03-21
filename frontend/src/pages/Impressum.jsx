import { useNavigate } from "react-router-dom";
import "./Privacy.css";

export default function Impressum() {
  const navigate = useNavigate();

  return (
    <main className="privacy-page privacy-page--fixed-header">
      <div className="privacy-header-fixed">
        <nav className="page-back-header">
          <button className="privacy-back" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </nav>

        <h1 className="privacy-title serif">Impressum</h1>
        <p className="privacy-updated text-muted">Angaben gemäß § 5 TMG</p>
      </div>

      <div className="privacy-sections privacy-sections--scroll">

        <section className="privacy-section">
          <h2 className="privacy-section-title">Responsible</h2>
          <p>[Your Full Name]</p>
          <p>[Street Address]<br />[Postal Code, City]<br />[Country]</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Contact</h2>
          <p>Email: <a href="mailto:hello@venn.lu">hello@venn.lu</a></p>
          <p>Phone: [Your Phone Number]</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">VAT ID</h2>
          <p>VAT identification number pursuant to §27a UStG:<br />[Your VAT ID, if applicable]</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Dispute Resolution</h2>
          <p>The European Commission provides a platform for online dispute resolution (OS): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
          <p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
        </section>

        <section className="privacy-section">
          <h2 className="privacy-section-title">Liability for Content</h2>
          <p>As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 (1) TMG. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.</p>
        </section>

      </div>
    </main>
  );
}
