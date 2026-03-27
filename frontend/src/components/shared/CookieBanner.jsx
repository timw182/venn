import { useState, useEffect } from 'react';

const CONSENT_KEY = 'venn_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
    if (typeof window._vennFaroInit === 'function') {
      window._vennFaroInit();
      window._vennFaroInit = null;
    }
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'false');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '12px',
      zIndex: 9999,
      boxShadow: '0 -4px 24px rgba(45,31,61,0.08)',
    }}>
      <p style={{
        margin: 0, fontSize: '13px', lineHeight: '1.5',
        color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)',
      }}>
        We use analytics cookies to improve your experience. See our{' '}
        <a href="/privacy" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
          Privacy Policy
        </a>.
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={decline} style={{
          padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
          background: 'transparent', color: 'var(--color-text-muted)',
          fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>Decline</button>
        <button onClick={accept} style={{
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          background: 'var(--color-accent)', color: '#fff',
          fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}>Accept</button>
      </div>
    </div>
  );
}
