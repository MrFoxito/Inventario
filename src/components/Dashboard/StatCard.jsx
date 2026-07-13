import React, { useMemo } from 'react';
import CountUp from 'react-countup';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

export default function StatCard({ title, value, icon, trend, color = 'primary', delay = 0 }) {
  // Generate a random aesthetic upward trend for the sparkline
  const sparklineData = useMemo(() => {
    const data = [];
    let prev = 50;
    for (let i = 0; i < 15; i++) {
      prev = prev + Math.floor(Math.random() * 20) - 5;
      data.push({ value: prev });
    }
    return data;
  }, []);

  const getStrokeColor = () => {
    switch(color) {
      case 'success': return 'var(--accent-success)';
      case 'warning': return 'var(--accent-warning)';
      case 'info': return 'var(--accent-info)';
      case 'danger': return 'var(--accent-danger)';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <div
      className={`stat-card ${color}`}
      style={{ animationDelay: `${delay}s`, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', opacity: 0.15, pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="value" stroke={getStrokeColor()} strokeWidth={3} dot={false} isAnimationActive={true} animationDuration={2000} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="stat-card-header">
        <div className="stat-card-icon">{icon}</div>
        <span className="stat-card-label">{title}</span>
      </div>
      <div className="stat-card-value">
        <CountUp end={value} duration={2.5} separator="," />
      </div>
      {trend && <div className="stat-card-sub">{trend}</div>}
      <div className="stat-card-bg" style={{ opacity: 0.05 }}>{icon}</div>
    </div>
  );
}
