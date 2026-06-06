'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useCricket } from '../store/cricketStore';
import { Modal, ConfirmModal, ColorPicker, Toast, useToast, EmptyState } from '../components/ui';
import Link from 'next/link';

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

export default function TeamsPage() {
  const { teams, matches, addTeam, updateTeam, deleteTeam, addPlayerToTeam, removePlayerFromTeam, updatePlayerInTeam } = useCricket();
  const { toast, show } = useToast();

  // Team modals
  const [showAdd, setShowAdd] = useState(false);
  const [editTeamId, setEditTeamId] = useState(null);
  const [deleteTeamId, setDeleteTeamId] = useState(null);

  // Player modals
  const [addPlayerTeamId, setAddPlayerTeamId] = useState(null);
  const [editPlayer, setEditPlayer] = useState(null); // { teamId, player }
  const [deletePlayer, setDeletePlayer] = useState(null); // { teamId, playerId, name }

  // UI state
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.shortName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 Teams</h1>
            <div className="page-subtitle">Manage your cricket teams and players</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Team</button>
        </div>

        <div className="page-body">
          <div style={{ marginBottom: 20 }}>
            <input
              className="form-input"
              placeholder="🔍 Search teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No teams found"
              desc="Create your first team to start scoring matches"
              action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Create Team</button>}
            />
          ) : (
            <div className="grid-auto">
              {filtered.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  matches={matches}
                  expanded={expandedTeam === team.id}
                  onExpand={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                  onEditTeam={() => setEditTeamId(team.id)}
                  onDeleteTeam={() => setDeleteTeamId(team.id)}
                  onAddPlayer={() => setAddPlayerTeamId(team.id)}
                  onEditPlayer={(p) => setEditPlayer({ teamId: team.id, player: p })}
                  onDeletePlayer={(p) => setDeletePlayer({ teamId: team.id, playerId: p.id, name: p.name })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ---- Team Modals ---- */}
        <TeamModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSave={(d) => { addTeam(d); setShowAdd(false); show('Team created! 🎉'); }}
          title="New Team"
        />
        <TeamModal
          key={editTeamId || 'edit-team'}
          open={!!editTeamId}
          onClose={() => setEditTeamId(null)}
          onSave={(d) => { updateTeam(editTeamId, d); setEditTeamId(null); show('Team updated!'); }}
          title="Edit Team"
          initial={teams.find(t => t.id === editTeamId)}
        />
        <ConfirmModal
          open={!!deleteTeamId}
          onClose={() => setDeleteTeamId(null)}
          onConfirm={() => { deleteTeam(deleteTeamId); setDeleteTeamId(null); show('Team deleted', 'error'); }}
          title="Delete Team"
          message={`Are you sure you want to delete "${teams.find(t => t.id === deleteTeamId)?.name}"? This cannot be undone.`}
        />

        {/* ---- Player Modals ---- */}
        <PlayerModal
          open={!!addPlayerTeamId}
          onClose={() => setAddPlayerTeamId(null)}
          onSave={(p) => { addPlayerToTeam(addPlayerTeamId, p); show('Player added! 👤'); }}
          title="Add Player"
        />
        <PlayerModal
          key={editPlayer?.player?.id || 'edit-player'}
          open={!!editPlayer}
          onClose={() => setEditPlayer(null)}
          onSave={(p) => {
            updatePlayerInTeam(editPlayer.teamId, editPlayer.player.id, p);
            setEditPlayer(null);
            show('Player updated!');
          }}
          title="Edit Player"
          initial={editPlayer?.player}
        />
        <ConfirmModal
          open={!!deletePlayer}
          onClose={() => setDeletePlayer(null)}
          onConfirm={() => {
            removePlayerFromTeam(deletePlayer.teamId, deletePlayer.playerId);
            setDeletePlayer(null);
            show('Player removed', 'error');
          }}
          title="Remove Player"
          message={`Remove "${deletePlayer?.name}" from this team?`}
        />

        <Toast toast={toast} />
      </main>
    </div>
  );
}

function TeamCard({ team, matches, expanded, onExpand, onEditTeam, onDeleteTeam, onAddPlayer, onEditPlayer, onDeletePlayer }) {
  const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
  const wins = matches.filter(m => m.result?.winner === team.id).length;
  const losses = teamMatches.filter(m => m.status === 'completed').length - wins;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `linear-gradient(135deg, ${team.color || '#10b981'}, ${team.color ? team.color + '88' : '#059669'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Oswald', fontSize: 22, fontWeight: 700, color: '#fff',
          boxShadow: `0 4px 12px ${team.color || '#10b981'}44`,
          flexShrink: 0,
        }}>
          {(team.shortName || team.name || '?')[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {team.shortName && <span className="badge badge-gray">{team.shortName}</span>}
            {team.homeGround && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {team.homeGround}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onEditTeam} title="Edit Team">✏️</button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={onDeleteTeam} title="Delete Team">🗑️</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Played', val: teamMatches.length, bg: 'rgba(255,255,255,0.05)' },
          { label: 'Won', val: wins, bg: 'rgba(16,185,129,0.1)', color: 'var(--green-primary)' },
          { label: 'Lost', val: losses, bg: 'rgba(239,68,68,0.1)', color: 'var(--red-light)' },
          { label: 'Players', val: team.players?.length || 0, bg: 'rgba(59,130,246,0.1)', color: 'var(--blue-light)' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: s.bg, borderRadius: 8 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Players Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button
            onClick={onExpand}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            👤 Players ({team.players?.length || 0}) {expanded ? '▲' : '▼'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAddPlayer}>+ Add Player</button>
        </div>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
            {!team.players?.length ? (
              <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No players yet — click "+ Add Player"
              </div>
            ) : team.players.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `${team.color || '#10b981'}22`,
                  color: team.color || 'var(--green-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, fontFamily: 'Oswald',
                }}>
                  {p.jerseyNo || (p.name || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    {p.isCaptain && <span className="badge badge-gold" style={{ fontSize: 9, padding: '2px 6px' }}>C</span>}
                    {p.isWK && <span className="badge badge-blue" style={{ fontSize: 9, padding: '2px 6px' }}>WK</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.role}{p.jerseyNo ? ` • #${p.jerseyNo}` : ''}{p.battingStyle ? ` • ${p.battingStyle}` : ''}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    title="Edit player"
                    onClick={() => onEditPlayer(p)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
                      background: 'rgba(59,130,246,0.1)', color: 'var(--blue-light)',
                      cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✏️</button>
                  <button
                    title="Remove player"
                    onClick={() => onDeletePlayer(p)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)', color: 'var(--red-light)',
                      cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href={`/teams/${team.id}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
        View Full Profile →
      </Link>
    </div>
  );
}

function TeamModal({ open, onClose, onSave, title, initial }) {
  const defaults = { name: '', shortName: '', color: '#10b981', homeGround: '', coach: '', founded: '' };
  const [form, setForm] = useState({ ...defaults, ...(initial || {}) });

  // Sync form whenever the modal opens with new data (edit mode)
  useEffect(() => {
    if (open) {
      setForm({ ...defaults, ...(initial || {}) });
    }
  }, [open, initial?.id]);

  if (!open) return null;

  const handleSave = () => {
    if (!form.name.trim()) return alert('Team name is required');
    onSave(form);
    setForm({ name: '', shortName: '', color: '#10b981', homeGround: '', coach: '', founded: '' });
  };

  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Team</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Team Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mumbai Indians" />
        </div>
        <div className="form-group">
          <label className="form-label">Short Name</label>
          <input className="form-input" value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value.slice(0, 4).toUpperCase() }))} placeholder="e.g. MI" maxLength={4} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Home Ground</label>
          <input className="form-input" value={form.homeGround} onChange={e => setForm(f => ({ ...f, homeGround: e.target.value }))} placeholder="e.g. Wankhede Stadium" />
        </div>
        <div className="form-group">
          <label className="form-label">Coach</label>
          <input className="form-input" value={form.coach} onChange={e => setForm(f => ({ ...f, coach: e.target.value }))} placeholder="e.g. Mahela Jayawardene" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Team Color</label>
        <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: form.color, border: '1px solid var(--border)' }}></div>
          <input
            className="form-input"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            placeholder="#10b981"
            style={{ maxWidth: 120 }}
          />
        </div>
      </div>
    </Modal>
  );
}

function PlayerModal({ open, onClose, onSave, title = 'Add Player', initial }) {
  const blank = { name: '', role: 'Batsman', jerseyNo: '', isCaptain: false, isWK: false, battingStyle: '', bowlingStyle: '' };
  const [form, setForm] = useState({ ...blank, ...(initial || {}) });

  // Sync form whenever the modal opens with new initial (edit mode)
  useEffect(() => {
    if (open) {
      setForm({ ...blank, ...(initial || {}) });
    }
  }, [open, initial?.id]);

  if (!open) return null;

  const handleSave = () => {
    if (!form.name.trim()) return alert('Player name is required');
    onSave({ ...form });
    setForm(blank);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {title.startsWith('Edit') ? 'Save Changes' : 'Add Player'}
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Player Name *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Jersey No.</label>
          <input
            type="number"
            className="form-input"
            value={form.jerseyNo}
            onChange={e => setForm(f => ({ ...f, jerseyNo: e.target.value }))}
            placeholder="e.g. 18"
            min={1} max={99}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Batting Style</label>
          <select className="form-select" value={form.battingStyle} onChange={e => setForm(f => ({ ...f, battingStyle: e.target.value }))}>
            <option value="">Select...</option>
            <option>Right-handed</option>
            <option>Left-handed</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Bowling Style</label>
        <select className="form-select" value={form.bowlingStyle} onChange={e => setForm(f => ({ ...f, bowlingStyle: e.target.value }))}>
          <option value="">Select...</option>
          <option>Right-arm Fast</option>
          <option>Right-arm Medium</option>
          <option>Right-arm Off-break</option>
          <option>Right-arm Leg-break</option>
          <option>Left-arm Fast</option>
          <option>Left-arm Medium</option>
          <option>Left-arm Orthodox</option>
          <option>Left-arm Wrist-spin</option>
          <option>Does not bowl</option>
        </select>
      </div>
      <div style={{
        display: 'flex', gap: 20,
        padding: '12px 16px', background: 'var(--bg-secondary)',
        borderRadius: 8, border: '1px solid var(--border)',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.isCaptain}
            onChange={e => setForm(f => ({ ...f, isCaptain: e.target.checked }))}
            style={{ width: 16, height: 16 }}
          />
          <span>🏅 Captain</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.isWK}
            onChange={e => setForm(f => ({ ...f, isWK: e.target.checked }))}
            style={{ width: 16, height: 16 }}
          />
          <span>🧤 Wicket-keeper</span>
        </label>
      </div>
    </Modal>
  );
}
