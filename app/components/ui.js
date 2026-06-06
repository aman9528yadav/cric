'use client';
import { useState, useEffect } from 'react';

const TEAM_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#a855f7', '#14b8a6', '#6366f1',
];

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

export function Toast({ toast }) {
  if (!toast) return null;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className={`toast toast-${toast.type}`} key={toast.id}>
      <span>{icons[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}

export function ColorPicker({ value, onChange }) {
  return (
    <div className="color-options">
      {TEAM_COLORS.map(c => (
        <div
          key={c}
          className={`color-swatch ${value === c ? 'selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  );
}

export function TeamAvatar({ team, size = 'md' }) {
  if (!team) return null;
  const initial = (team.shortName || team.name || '?')[0].toUpperCase();
  const style = {
    background: `linear-gradient(135deg, ${team.color || '#10b981'}, ${team.color ? team.color + 'aa' : '#059669'})`,
  };
  return (
    <div className={`team-avatar${size === 'sm' ? ' team-avatar-sm' : ''}`} style={style}>
      {initial}
    </div>
  );
}

export function formatOvers(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export function calcRunRate(runs, balls) {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 6).toFixed(2);
}

export function getMatchStatus(match) {
  if (match.status === 'upcoming') return { label: 'Upcoming', color: 'gray' };
  if (match.status === 'live') return { label: 'LIVE', color: 'green' };
  if (match.status === 'completed') return { label: 'Completed', color: 'blue' };
  return { label: match.status, color: 'gray' };
}

export function Modal({ open, onClose, title, children, footer, size = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? 'modal-' + size : ''} fade-in`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>Delete</button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
    </Modal>
  );
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
      {action}
    </div>
  );
}

export function StatCard({ icon, value, label, color = 'green' }) {
  return (
    <div className="stat-box">
      <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
