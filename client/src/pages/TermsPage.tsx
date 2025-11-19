import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <main className="container legal-page">
      <article className="card legal-card">
        <header>
          <p className="muted">View terms</p>
          <h1>Use of MoodPeek</h1>
        </header>
        <p>
          MoodPeek is a student-built project that helps you track moods and surface personal insights.
          By signing in and making entries, you agree to use it for personal reflection only and to provide
          honest data that you are comfortable storing with your account.
        </p>
        <section>
          <h2>What we do with your entries</h2>
          <ul>
            <li>Entries power the dashboard, calendar, and weekly reports that you see in the app.</li>
            <li>Your mood history stays tied to your account and is not sold or shared with advertisers.</li>
            <li>You control your data—delete any entry at any time inside the app.</li>
          </ul>
        </section>
        <section>
          <h2>Student project notice</h2>
          <p>
            The service is provided as-is for educational purposes. There are no enterprise guarantees,
            so please avoid storing highly sensitive details. If something looks off, reach out to the
            project team or simply delete your entries.
          </p>
        </section>
        <Link to="/" className="text-link">
          Back to dashboard
        </Link>
      </article>
    </main>
  );
}
