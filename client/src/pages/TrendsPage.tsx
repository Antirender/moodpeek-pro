import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR from "swr";
import { fetchJSON } from "../lib/http";
import HeatmapTempMood from "../components/charts/HeatmapTempMood";
import LineAvgScore from "../components/charts/LineAvgScore";
import TagContribBar from "../components/charts/TagContribBar";
import ChartHelp from "../components/charts/ChartHelp";
import "../styles/charts.css";
import type { Entry } from "../types";

export default function TrendsPage() {
  const { data, isLoading, error } = useSWR<Entry[]>("/entries", fetchJSON);
  const location = useLocation();
  const navigate = useNavigate();
  const trendCardRef = useRef<HTMLDivElement | null>(null);
  const [highlightTrend, setHighlightTrend] = useState(false);

  useEffect(() => {
    if (location.hash !== '#trend-chart') return;
    requestAnimationFrame(() => {
      trendCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightTrend(true);
    });
    const timeout = window.setTimeout(() => setHighlightTrend(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [location.hash]);
  
  if (error) return <article className="contrast"><p>read/fetch error</p></article>;
  if (isLoading || !data) return <progress />;

  const entries = data ?? [];
  const distinctDayCount = useMemo(() => {
    if (!entries.length) return 0;
    const daySet = new Set<string>();
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      if (Number.isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      daySet.add(date.toDateString());
    });
    return daySet.size;
  }, [entries]);

  const hasTrendData = distinctDayCount >= 2;
  /**
 * AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
 * Reference: https://chatgpt.com/share/68faee5b-180c-800c-9ff2-b877d37f3f51
 * Add/remove/refine more details by myself
 */
  return (
    <main>
      <div className="trends-container">
        <header>
          <h2>Mood Trends</h2>
          <p style={{ color: 'var(--pico-muted-color)' }}>
            Visualize patterns in your mood data over time, by temperature, and by activity tags.
          </p>
        </header>
        
        <ChartHelp defaultOpen={false} />
        
        <section className="trends-grid">
          {hasTrendData ? (
            <>
              <div className="chart-card">
                <h3 className="chart-title">Temperature × Mood Heatmap</h3>
                <HeatmapTempMood data={entries as any} aria-label="Temperature by mood heatmap" />
              </div>
              
              <div
                id="trend-chart"
                ref={trendCardRef}
                className={`chart-card${highlightTrend ? ' chart-card--highlight' : ''}`}
              >
                <h3 className="chart-title">Mood Over Time</h3>
                <LineAvgScore data={entries as any} aria-label="Mood over time line chart" />
              </div>
              
              <div className="chart-card">
                <h3 className="chart-title">Tag Analysis</h3>
                <TagContribBar data={entries as any} aria-label="Tag contribution bar chart" />
              </div>
            </>
          ) : (
            <article className="chart-card empty-chart-card">
              <h3 className="chart-title">We need at least 2 days of data to unlock these charts.</h3>
              <p className="muted">
                Log moods on a couple of different days, then come back to see trends, heatmaps, and tags take shape. Right now we have {distinctDayCount} logged {distinctDayCount === 1 ? 'day' : 'days'} to work with.
              </p>
              <button
                type="button"
                className="btn-cta"
                onClick={() => navigate('/entries?date=today')}
              >
                Log today’s mood
              </button>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}