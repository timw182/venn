import { useNavigate } from "react-router-dom";
import "./Experts.css";

const QUOTES = [
  { emoji: "🔬", text: "We asked a scientist but they said they were busy swiping." },
  { emoji: "🎓", text: '"Venn is the most important discovery since gravity." — Someone, probably.' },
  { emoji: "📋", text: "Our clinical trials consisted of two people on a couch. Results were positive." },
  { emoji: "🧠", text: '"Communication is key." We just made the lock a little more fun.' },
  { emoji: "🏆", text: "Winner of zero awards. But we believe in ourselves." },
];

export default function Experts() {
  const navigate = useNavigate();

  return (
    <main className="experts-page">
      <div className="experts-top">
        <nav className="experts-nav">
          <button className="experts-back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </nav>

        <div className="experts-header">
          <h1 className="experts-title serif">What Experts Say</h1>
          <p className="experts-subtitle text-muted">...once we find some</p>
        </div>
      </div>

      <div className="experts-hero">
        <span className="experts-hero-emoji">🧑‍🔬</span>
        <h2 className="experts-hero-title">Still looking for experts</h2>
        <p className="experts-hero-body text-muted">
          Turns out, nobody has a PhD in "couple swiping dynamics" yet. If you know someone, send them our way.
        </p>
      </div>

      <div className="experts-quotes">
        {QUOTES.map((q, i) => (
          <article key={i} className="experts-card">
            <span className="experts-card-emoji">{q.emoji}</span>
            <p className="experts-card-text">{q.text}</p>
          </article>
        ))}
      </div>

      <p className="experts-footer text-muted">
        In all seriousness — Venn is built on the simple idea that talking about what you want shouldn't be awkward.
      </p>
    </main>
  );
}
