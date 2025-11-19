import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <main className="container legal-page">
      <article className="card legal-card">
        <header>
          <p className="muted">Privacy notice</p>
          <h1>How your data is handled</h1>
        </header>
        <p>
          MoodPeek stores the mood entries, tags, and notes you add so it can calculate weekly reports,
          streaks, and charts. The data stays linked to your account in the MoodPeek database and is not
          shared with external services beyond what is needed to run the app.
        </p>
        <section>
          <h2>Key points</h2>
          <ul>
            <li>Your entries feed the dashboard cards, calendar summaries, and trends visualizations.</li>
            <li>No third parties receive or sell your personal reflections.</li>
            <li>You can delete entries whenever you like, and the insights will update automatically.</li>
          </ul>
        </section>
        <section>
          <h2>Need a refresher?</h2>
          <p>
            If you step away for a while, log a couple of new moods and come back after a few days to see
            refreshed reports. This project is for learning purposes, so please avoid sharing sensitive
            health or identity data.
          </p>
        </section>
        <Link to="/" className="text-link">
          Back to dashboard
        </Link>
      </article>
    </main>
  );
}
