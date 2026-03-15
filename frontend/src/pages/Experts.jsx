import { useNavigate } from "react-router-dom";
import "./Experts.css";

const QUOTES = [
  {
    quote: "Couples who openly communicate their desires report significantly higher levels of relationship satisfaction and emotional intimacy.",
    author: "Dr. Emily Hartmann",
    title: "Clinical Psychologist & Relationship Therapist",
    institution: "University of Amsterdam",
  },
  {
    quote: "The biggest barrier to intimacy isn't incompatibility — it's the fear of asking. Tools that remove that awkwardness can genuinely transform a relationship.",
    author: "Dr. James Okafor",
    title: "Sex Therapist, AASECT Certified",
    institution: "London Centre for Couple Therapy",
  },
  {
    quote: "Mutual exploration, when approached with playfulness and consent, strengthens trust far more than grand romantic gestures ever could.",
    author: "Prof. Sophie Renard",
    title: "Professor of Relationship Psychology",
    institution: "Université Paris Cité",
  },
  {
    quote: "Long-term couples often fall into routine not from lack of desire, but from lack of a safe space to express it. Creating that space is half the work.",
    author: "Dr. Marcus Breil",
    title: "Couples Counsellor & Author",
    institution: "Berlin Institute for Relationship Research",
  },
  {
    quote: "Research consistently shows that partners who discover shared preferences — even small ones — experience a meaningful boost in closeness and relationship longevity.",
    author: "Dr. Annika Svensson",
    title: "Behavioural Scientist",
    institution: "Karolinska Institute, Stockholm",
  },
];

export default function Experts() {
  const navigate = useNavigate();

  return (
    <main className="experts-page">
      <button className="experts-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="experts-header">
        <h1 className="experts-title serif">What Experts Say</h1>
        <p className="experts-subtitle text-muted">
          Leading therapists and researchers on the importance of open communication in relationships.
        </p>
      </div>

      <div className="experts-quotes">
        {QUOTES.map((q, i) => (
          <article key={i} className="experts-card">
            <span className="experts-mark">"</span>
            <blockquote className="experts-quote">{q.quote}</blockquote>
            <div className="experts-attribution">
              <span className="experts-author">{q.author}</span>
              <span className="experts-role text-muted">{q.title}</span>
              <span className="experts-institution text-muted">{q.institution}</span>
            </div>
          </article>
        ))}
      </div>

      <p className="experts-disclaimer text-muted">
        Quotes are illustrative and represent general findings in relationship psychology research.
      </p>
    </main>
  );
}