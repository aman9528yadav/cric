'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useCricket } from '../store/cricketStore';
import { Modal, ConfirmModal, ColorPicker, Toast, useToast, EmptyState } from '../components/ui';
import Link from 'next/link';

const FORMATS = ['T20', 'ODI', 'Test', 'T10', 'The Hundred', 'Custom'];
const STATUSES = ['upcoming', 'ongoing', 'completed'];

export default function TournamentsPage() {
  const { tournaments, teams, matches, addTournament, updateTournament, deleteTournament } = useCricket();
  const { toast, show } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tournaments : tournaments.filter(t => t.status === filter);

  const handleAdd = (data) => {
    addTournament(data);
    setShowAdd(false);
    show('Tournament created!');
  };

  const handleEdit = (data) => {
    updateTournament(editId, data);
    setEditId(null);
    show('Tournament updated!');
  };

  const handleDelete = () => {
    deleteTournament(deleteId);
    setDeleteId(null);
    show('Tournament deleted', 'error');
  };

  const editTournament = tournaments.find(t => t.id === editId);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 Tournaments</h1>
            <div className="page-subtitle">Manage your cricket tournaments</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Tournament</button>
        </div>

        <div className="page-body">
          {/* Filter Tabs */}
          <div style={{ marginBottom: 20 }}>
            <div className="tabs">
              {['all', 'upcoming', 'ongoing', 'completed'].map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>
                    ({f === 'all' ? tournaments.length : tournaments.filter(t => t.status === f).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No tournaments found"
              desc="Create your first tournament to get started"
              action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Create Tournament</button>}
            />
          ) : (
            <div className="grid-3">
              {filtered.map(t => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  matches={matches.filter(m => m.tournamentId === t.id)}
                  teams={teams}
                  onEdit={() => setEditId(t.id)}
                  onDelete={() => setDeleteId(t.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Modal */}
        <TournamentModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          teams={teams}
          title="New Tournament"
        />

        {/* Edit Modal */}
        <TournamentModal
          open={!!editId}
          onClose={() => setEditId(null)}
          onSave={handleEdit}
          teams={teams}
          title="Edit Tournament"
          initial={editTournament}
        />

        {/* Delete Confirm */}
        <ConfirmModal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Tournament"
          message="Are you sure? This will delete all matches in this tournament."
        />

        <Toast toast={toast} />
      </main>
    </div>
  );
}

function TournamentCard({ tournament, matches, teams, onEdit, onDelete }) {
  const completed = matches.filter(m => m.status === 'completed').length;
  const statusColors = { upcoming: 'gray', ongoing: 'green', completed: 'blue' };
  const progress = matches.length > 0 ? (completed / matches.length) * 100 : 0;

  const finalMatch = matches.find(m => m.stage === 'Final' && m.status === 'completed');
  const championTeam = finalMatch?.result?.winner ? teams.find(t => t.id === finalMatch.result.winner) : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🏆</div>
          <div>
            <div style={{ fontFamily: 'Oswald', fontSize: 17, fontWeight: 700 }}>{tournament.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tournament.format}</div>
          </div>
        </div>
        {championTeam ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-light)', textAlign: 'right' }}>
            🏆 Won by<br/>{championTeam.name}
          </div>
        ) : (
          <span className={`badge badge-${statusColors[tournament.status] || 'gray'}`}>
            {tournament.status}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          📅 {tournament.startDate || 'TBD'} {tournament.endDate && `→ ${tournament.endDate}`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700 }}>{tournament.teams?.length || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Teams</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700 }}>{matches.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Matches</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700, color: 'var(--green-primary)' }}>{completed}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Played</div>
        </div>
      </div>

      {matches.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {tournament.description && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {tournament.description}
        </div>
      )}

      {/* Teams in tournament */}
      {tournament.teams?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tournament.teams.map(teamId => {
            const team = teams.find(t => t.id === teamId);
            if (!team) return null;
            return (
              <div key={teamId} className="badge badge-gray" style={{ gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: team.color || 'var(--green-primary)',
                }}></div>
                {team.shortName || team.name}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Link href={`/tournaments/${tournament.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          View Details
        </Link>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={onEdit} title="Edit">✏️</button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete} title="Delete">🗑️</button>
      </div>
    </div>
  );
}

function TournamentModal({ open, onClose, onSave, teams, title, initial }) {
  const [form, setForm] = useState({
    name: '', format: 'T20', startDate: '', endDate: '',
    description: '', teams: [], status: 'upcoming', totalOvers: 20,
    tier: 'normal', structure: 'round-robin', matchesPerTeam: 1, qualifyingCount: 4, pointsPerWin: 2, pointsPerTie: 1, fixtureMode: 'auto', manualFixtures: [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: '', format: 'T20', startDate: '', endDate: '',
        description: '', teams: [], status: 'upcoming', totalOvers: 20,
        tier: 'normal', structure: 'round-robin', matchesPerTeam: 1, qualifyingCount: 4, pointsPerWin: 2, pointsPerTie: 1, fixtureMode: 'auto', manualFixtures: [],
        ...(initial || {}),
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const toggle = (id) => {
    setForm(f => ({
      ...f,
      teams: f.teams.includes(id) ? f.teams.filter(x => x !== id) : [...f.teams, id],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return alert('Tournament name required');
    onSave(form);
    setForm({ name: '', format: 'T20', startDate: '', endDate: '', description: '', teams: [], status: 'upcoming', totalOvers: 20 });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Tournament</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tournament Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. IPL 2025" />
        </div>
        <div className="form-group">
          <label className="form-label">Format</label>
          <select className="form-select" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
            {FORMATS.map(fmt => <option key={fmt}>{fmt}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Overs Per Innings</label>
          <input type="number" className="form-input" value={form.totalOvers} min={1} max={50} onChange={e => setForm(f => ({ ...f, totalOvers: parseInt(e.target.value) || 20 }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 16 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tournament Tier</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${form.tier === 'normal' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, tier: 'normal' }))} style={{ flex: 1 }}>Standard</button>
            <button className={`btn ${form.tier === 'premium' ? 'btn-gold' : 'btn-secondary'}`} onClick={() => setForm(f => ({ ...f, tier: 'premium' }))} style={{ flex: 1 }}>🌟 Premium</button>
          </div>
        </div>
      </div>

      {form.tier === 'premium' && (
        <div style={{ background: 'rgba(245,158,11,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-light)', marginBottom: 12 }}>Premium Configuration</div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Structure</label>
              <select className="form-select" value={form.structure} onChange={e => setForm(f => ({ ...f, structure: e.target.value }))}>
                <option value="round-robin">Round Robin</option>
                <option value="groups">Groups</option>
                <option value="knockout">Knockout Only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Matches vs Each Team</label>
              <input type="number" className="form-input" value={form.matchesPerTeam} min={1} max={5} onChange={e => setForm(f => ({ ...f, matchesPerTeam: parseInt(e.target.value) || 1 }))} disabled={form.fixtureMode === 'manual'} />
            </div>
            <div className="form-group">
              <label className="form-label">Qualify for Knockouts</label>
              <select className="form-select" value={form.qualifyingCount} onChange={e => setForm(f => ({ ...f, qualifyingCount: parseInt(e.target.value) }))}>
                <option value={2}>Top 2 (Final directly)</option>
                <option value={4}>Top 4 (Semis)</option>
                <option value={8}>Top 8 (Quarters)</option>
              </select>
            </div>
          </div>
          <div className="form-row-3" style={{ marginTop: 12 }}>
             <div className="form-group">
              <label className="form-label">Points per Win</label>
              <input type="number" className="form-input" value={form.pointsPerWin} min={1} max={10} onChange={e => setForm(f => ({ ...f, pointsPerWin: parseInt(e.target.value) || 2 }))} />
            </div>
             <div className="form-group">
              <label className="form-label">Points per Tie/NR</label>
              <input type="number" className="form-input" value={form.pointsPerTie} min={0} max={10} onChange={e => setForm(f => ({ ...f, pointsPerTie: parseInt(e.target.value) || 1 }))} />
            </div>
             <div className="form-group">
              <label className="form-label">Fixture Generation</label>
              <select className="form-select" value={form.fixtureMode || 'auto'} onChange={e => setForm(f => ({ ...f, fixtureMode: e.target.value }))}>
                <option value="auto">Auto Generate</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>
          </div>

          {form.fixtureMode === 'manual' && (
            <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <div style={{ fontSize: 13, fontWeight: 600 }}>Manual Fixtures</div>
                 <button className="btn btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, manualFixtures: [...(f.manualFixtures || []), { id: Date.now() + Math.random(), team1Id: '', team2Id: '', date: '' }] }))}>+ Add Match</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {(form.manualFixtures || []).map((mf, index) => (
                  <div key={mf.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                     <select className="form-select" style={{ flex: 1 }} value={mf.team1Id} onChange={e => {
                        const newMf = [...form.manualFixtures];
                        newMf[index].team1Id = e.target.value;
                        setForm(f => ({ ...f, manualFixtures: newMf }));
                     }}>
                        <option value="">Select Team 1</option>
                        {teams.filter(t => form.teams.includes(t.id)).map(t => {
                          const isSelf = t.id === mf.team2Id;
                          const currentMatchupCount = (form.manualFixtures || []).filter((m, i) => i !== index && ((m.team1Id === t.id && m.team2Id === mf.team2Id) || (m.team2Id === t.id && m.team1Id === mf.team2Id))).length;
                          const reachedLimit = mf.team2Id && currentMatchupCount >= (form.matchesPerTeam || 1);
                          return <option key={t.id} value={t.id} disabled={isSelf || reachedLimit}>{t.name}</option>;
                        })}
                     </select>
                     <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>vs</span>
                     <select className="form-select" style={{ flex: 1 }} value={mf.team2Id} onChange={e => {
                        const newMf = [...form.manualFixtures];
                        newMf[index].team2Id = e.target.value;
                        setForm(f => ({ ...f, manualFixtures: newMf }));
                     }}>
                        <option value="">Select Team 2</option>
                        {teams.filter(t => form.teams.includes(t.id)).map(t => {
                          const isSelf = t.id === mf.team1Id;
                          const currentMatchupCount = (form.manualFixtures || []).filter((m, i) => i !== index && ((m.team1Id === mf.team1Id && m.team2Id === t.id) || (m.team2Id === mf.team1Id && m.team1Id === t.id))).length;
                          const reachedLimit = mf.team1Id && currentMatchupCount >= (form.matchesPerTeam || 1);
                          return <option key={t.id} value={t.id} disabled={isSelf || reachedLimit}>{t.name}</option>;
                        })}
                     </select>
                     <input type="date" className="form-input" style={{ width: 140 }} value={mf.date} onChange={e => {
                        const newMf = [...form.manualFixtures];
                        newMf[index].date = e.target.value;
                        setForm(f => ({ ...f, manualFixtures: newMf }));
                     }} />
                     <button className="btn btn-danger btn-sm" onClick={() => {
                        const newMf = form.manualFixtures.filter((_, i) => i !== index);
                        setForm(f => ({ ...f, manualFixtures: newMf }));
                     }}>X</button>
                  </div>
                ))}
                {(form.manualFixtures || []).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Click "+ Add Match" to schedule a fixture manually.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Select Teams</label>
        {teams.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
            No teams available. <Link href="/teams" style={{ color: 'var(--green-primary)' }}>Create teams first →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {teams.map(t => (
              <div
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${form.teams.includes(t.id) ? t.color || 'var(--green-primary)' : 'var(--border)'}`,
                  background: form.teams.includes(t.id) ? `${t.color}22` : 'var(--bg-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color || 'var(--green-primary)' }}></div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                {form.teams.includes(t.id) && <span>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
