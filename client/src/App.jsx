import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import './App.css';
import './styles/semantic.css';

// Import components
import Topbar from './components/Topbar';
import ParticleBackground from './components/ParticleBackground';
import ToastHost from './components/ToastHost';
import RequireAuth from './routes/RequireAuth';

// Import page components
import EntriesPage from './pages/EntriesPage';
import TrendsPage from './pages/TrendsPage';
import CalendarPage from './pages/CalendarPage';
import PreferencesPage from './pages/PreferencesPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb8be5-cf98-800c-ae08-6adc742d1572
// Reference: https://chatgpt.com/share/68fb8c3b-9a8c-800c-8169-d4b2aa0343bc
// Add more details by myself

// Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <article className="container">
          <h2>Something went wrong.</h2>
          <p>We couldn't load the content. Please try again later.</p>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </article>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <ParticleBackground />
      <ToastHost />
      <Topbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/entries" element={<EntriesPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/insights" element={<Navigate to="/trends" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
