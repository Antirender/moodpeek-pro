import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb843c-14d0-800c-9556-ae9ce9a8c1ed
// Add/remove/refine more details by myself

export default function ReportPage() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const start = params.get('start');
    const target = start ? `/calendar?start=${start}` : '/calendar';
    navigate(target, { replace: true });
  }, [navigate, search]);

  return (
    <main className="container">
      <article className="card">
        <p className="muted">Redirecting to the Calendar weekly report…</p>
      </article>
    </main>
  );
}