import { useNavigate } from 'react-router-dom';

export default function HomeLanding() {
  const navigate = useNavigate();

  return (
    <main className="container">
      <article className="grid mt-l">
        <div className="text-center card hero-card">
          <p className="auth-brand">MoodPeek</p>
          <p className="muted">You're already signed in.</p>
          <h1>Ready to continue?</h1>
          <p className="muted">Head to your dashboard to keep tracking your moods.</p>
          <div className="grid">
            <button type="button" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/entries')}>
              Open entries
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}
