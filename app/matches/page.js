'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useCricket } from '../store/cricketStore';
import { Modal, ConfirmModal, Toast, useToast, EmptyState, formatOvers } from '../components/ui';
import Link from 'next/link';

const FORMATS = ['T20', 'ODI', 'Test', 'T10', 'The Hundred', 'Custom'];

export default function MatchesPage() {
  const { teams, matches, tournaments, addMatch, deleteMatch } = useCricket();
  const { toast, show } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [tournFilter, setTournFilter] = useState('all');

  const filtered = matches.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (tournFilter !== 'all' && m.tournamentId !== tournFilter) return false;
    return true;
  });

  const handleAdd = (data) => {
    addMatch(data);
    setShowAdd(false);
    show('Match scheduled!');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏏 Matches</h1>
            <div className="page-subtitle">Schedule and manage all cricket matches</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Schedule Match</button>
        </div>

        <div className="page-body">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="tabs">
              {['all', 'upcoming', 'live', 'completed'].map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'live' && '🔴 '}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span style={{ marginLeft: 4, opacity: 0.6, fontSize: 11 }}>
                    ({f === 'all' ? matches.length : matches.filter(m => m.status === f).length})
                  </span>
                </button>
              ))}
            </div>
            <select
              className="form-select"
              value={tournFilter}
              onChange={e => setTournFilter(e.target.value)}
              style={{ width: 200 }}
            >
              <option value="all">All Tournaments</option>
              <option value="">No Tournament</option>
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🏏"
              title="No matches found"
              desc="Schedule your first match to start scoring"
              action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Schedule Match</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.slice().reverse().map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  teams={teams}
                  tournaments={tournaments}
                  onDelete={() => setDeleteId(match.id)}
                />
              ))}
            </div>
          )}
        </div>

        <AddMatchModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          teams={teams}
          tournaments={tournaments}
        />
        <ConfirmModal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => { deleteMatch(deleteId); setDeleteId(null); show('Match deleted', 'error'); }}
          title="Delete Match"
          message="Are you sure you want to delete this match?"
        />
        <Toast toast={toast} />
      </main>
    </div>
  );
}

function MatchCard({ match, teams, tournaments, onDelete }) {
  const t1 = teams.find(t => t.id === match.team1Id);
  const t2 = teams.find(t => t.id === match.team2Id);
  const tournament = tournaments.find(t => t.id === match.tournamentId);
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const statusColors = { upcoming: 'gray', live: 'green', completed: 'blue' };

  return (
    <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {/* Status */}
      <div style={{ minWidth: 80 }}>
        <span className={`badge badge-${statusColors[match.status] || 'gray'}`} style={{ justifyContent: 'center', width: '100%' }}>
          {match.status === 'live' ? <><span style={{ width: 6, height: 6, background: 'var(--green-light)', borderRadius: '50%', display: 'inline-block', marginRight: 4, animation: 'pulse 1.5s infinite' }}></span>LIVE</> : match.status}
        </span>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>{match.format}</div>
      </div>

      {/* Teams & Score */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          {/* Team 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${t1?.color || '#10b981'}, ${t1?.color ? t1.color + '88' : '#059669'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Oswald', fontSize: 13, fontWeight: 700,
            }}>{(t1?.shortName || t1?.name || '?')[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t1?.name || 'Team 1'}</div>
              {match.status !== 'upcoming' && (
                <div style={{ fontFamily: 'Oswald', fontSize: 16, color: match.result?.winner === match.team1Id ? 'var(--green-primary)' : 'var(--text-primary)' }}>
                  {inn1?.runs || 0}/{inn1?.wickets || 0}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>({formatOvers(inn1?.balls || 0)})</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ fontFamily: 'Oswald', fontSize: 14, color: 'var(--text-muted)', padding: '0 8px' }}>VS</div>

          {/* Team 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexDirection: 'row-reverse' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${t2?.color || '#3b82f6'}, ${t2?.color ? t2.color + '88' : '#2563eb'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Oswald', fontSize: 13, fontWeight: 700,
            }}>{(t2?.shortName || t2?.name || '?')[0]}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t2?.name || 'Team 2'}</div>
              {match.status !== 'upcoming' && (
                <div style={{ fontFamily: 'Oswald', fontSize: 16, color: match.result?.winner === match.team2Id ? 'var(--green-primary)' : 'var(--text-primary)' }}>
                  {inn2?.runs || 0}/{inn2?.wickets || 0}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>({formatOvers(inn2?.balls || 0)})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result / Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {match.result && (
            <div style={{ color: 'var(--green-primary)', fontWeight: 600 }}>
              🏆 {match.result.winner
                ? `${teams.find(t => t.id === match.result.winner)?.name || 'Team'} won by ${match.result.margin}`
                : 'Match Tied'}
            </div>
          )}
          {tournament && <span className="badge badge-gold" style={{ fontSize: 11 }}>🏆 {tournament.name}</span>}
          {match.venue && <span style={{ color: 'var(--text-muted)' }}>📍 {match.venue}</span>}
          {match.date && <span style={{ color: 'var(--text-muted)' }}>📅 {match.date}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Link href={`/matches/${match.id}`} className="btn btn-primary btn-sm">
          {match.status === 'live' ? '🔴 Score' : match.status === 'upcoming' ? '▶ Start' : '📋 View'}
        </Link>
        <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}

function AddMatchModal({ open, onClose, onSave, teams, tournaments }) {
  const [form, setForm] = useState({
    team1Id: '', team2Id: '', tournamentId: '', format: 'T20',
    totalOvers: 20, venue: '', date: '', time: '', stage: 'Group Stage'
  });

  if (!open) return null;

  const handleSave = () => {
    if (!form.team1Id || !form.team2Id) return alert('Please select both teams');
    if (form.team1Id === form.team2Id) return alert('Teams must be different');
    onSave(form);
    setForm({ team1Id: '', team2Id: '', tournamentId: '', format: 'T20', totalOvers: 20, venue: '', date: '', time: '', stage: 'Group Stage' });
  };

  const handleFormatChange = (fmt) => {
    const overs = { T20: 20, ODI: 50, Test: 0, T10: 10, 'The Hundred': 100 };
    setForm(f => ({ ...f, format: fmt, totalOvers: overs[fmt] || 20 }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule New Match"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Schedule Match</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Team 1 *</label>
          <select className="form-select" value={form.team1Id} onChange={e => setForm(f => ({ ...f, team1Id: e.target.value }))}>
            <option value="">Select Team 1</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Team 2 *</label>
          <select className="form-select" value={form.team2Id} onChange={e => setForm(f => ({ ...f, team2Id: e.target.value }))}>
            <option value="">Select Team 2</option>
            {teams.filter(t => t.id !== form.team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Format</label>
          <select className="form-select" value={form.format} onChange={e => handleFormatChange(e.target.value)}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Overs Per Innings</label>
          <input type="number" className="form-input" value={form.totalOvers} min={1} max={100}
            onChange={e => setForm(f => ({ ...f, totalOvers: parseInt(e.target.value) || 20 }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Time</label>
          <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Venue</label>
          <input className="form-input" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Stadium name" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tournament (optional)</label>
          <select className="form-select" value={form.tournamentId} onChange={e => setForm(f => ({ ...f, tournamentId: e.target.value }))}>
            <option value="">None</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stage</label>
          <select className="form-select" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} disabled={!form.tournamentId}>
            <option>Group Stage</option>
            <option>Quarter-Final</option>
            <option>Semi-Final</option>
            <option>Final</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
