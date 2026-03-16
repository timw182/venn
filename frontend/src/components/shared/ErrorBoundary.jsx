import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100dvh', gap: '1rem',
          padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif',
        }}>
          <p style={{ fontSize: '1.25rem', color: '#2D1F3D' }}>Something went wrong.</p>
          <p style={{ color: '#5C4A72', fontSize: '0.875rem' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem', padding: '0.5rem 1.5rem',
              background: '#C4547A', color: '#fff', border: 'none',
              borderRadius: '99px', cursor: 'pointer', fontSize: '0.875rem',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
