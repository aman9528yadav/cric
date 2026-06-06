'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useCricket } from '../../store/cricketStore';
import Link from 'next/link';
import { Modal } from '../../components/ui';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { teams, matches } = useCricket();
  const team = teams.find(t => t.id === id);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  if (!team) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: 32 }}>
          <div style={{ color: 'var(--text-muted)' }}>Team not found. <Link href="/teams">← Back</Link></div>
        </div>
      </main>
    </div>
  );

  const teamMatches = matches.filter(m => m.team1Id === id || m.team2Id === id);
  const completedMatches = teamMatches.filter(m => m.status === 'completed');
  const wins = matches.filter(m => m.result?.winner === id).length;
  const losses = completedMatches.length - wins;

  // Player stats from innings
  const playerStats = {};
  matches.forEach(match => {
    match.innings.forEach(inn => {
      if (inn.teamId !== id) return;
      (inn.batting || []).forEach(b => {
        if (!playerStats[b.id]) playerStats[b.id] = { name: b.name, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, fifties: 0, hundreds: 0, wickets: 0, overs: 0 };
        playerStats[b.id].runs += b.runs || 0;
        playerStats[b.id].balls += b.balls || 0;
        playerStats[b.id].fours += b.fours || 0;
        playerStats[b.id].sixes += b.sixes || 0;
        if (b.balls > 0) playerStats[b.id].innings += 1;
        if (b.runs >= 100) playerStats[b.id].hundreds += 1;
        else if (b.runs >= 50) playerStats[b.id].fifties += 1;
      });
    });
    // Bowling from opposition innings
    match.innings.forEach(inn => {
      if (inn.teamId === id) return;
      (inn.bowling || []).forEach(b => {
        if (!playerStats[b.id]) playerStats[b.id] = { name: b.name, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, fifties: 0, hundreds: 0, wickets: 0, overs: 0 };
        playerStats[b.id].wickets += b.wickets || 0;
        playerStats[b.id].overs += b.balls || 0;
      });
    });
  });

  const topBatsmen = Object.values(playerStats).sort((a, b) => b.runs - a.runs).slice(0, 5);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="mobile-back-btn" onClick={() => router.back()} title="Go Back" style={{ margin: 0 }}>←</button>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${team.color || '#10b981'}, ${team.color ? team.color + '88' : '#059669'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Oswald', fontSize: 24, fontWeight: 700,
              boxShadow: `0 4px 20px ${team.color || '#10b981'}44`,
            }}>{(team.shortName || team.name)[0]}</div>
            <div>
              <div className="desktop-breadcrumb" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <Link href="/teams" style={{ color: 'var(--green-primary)', textDecoration: 'none' }}>← Teams</Link>
              </div>
              <h1 className="page-title">{team.name}</h1>
              <div className="page-subtitle">{team.shortName} {team.homeGround && `• ${team.homeGround}`} {team.coach && `• Coach: ${team.coach}`}</div>
            </div>
          </div>
        </div>

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats Row */}
          <div className="grid-4">
            {[
              { label: 'Matches', val: teamMatches.length, color: 'blue', icon: '🏏' },
              { label: 'Wins', val: wins, color: 'green', icon: '🏆' },
              { label: 'Losses', val: losses, color: 'red', icon: '😔' },
              { label: 'Players', val: team.players?.length || 0, color: 'purple', icon: '👤' },
            ].map(s => (
              <div key={s.label} className="stat-box">
                <div className={`stat-icon stat-icon-${s.color}`}>{s.icon}</div>
                <div>
                  <div className="stat-value">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Players */}
            <section>
              <div className="section-header">
                <h2 className="section-title">👤 Squad</h2>
                <Link href="/teams" className="btn btn-secondary btn-sm">Manage</Link>
              </div>
              <div className="card" style={{ padding: 8 }}>
                {!team.players?.length ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No players</div>
                ) : team.players.map(p => (
                  <div 
                    key={p.id} 
                    className="player-item" 
                    onClick={() => setSelectedPlayer(p)}
                    style={{ cursor: 'pointer', transition: 'background 0.2s', ...({':hover': {background: 'rgba(255,255,255,0.05)'}}) }}
                  >
                    <div className="player-avatar" style={{ background: `${team.color || '#10b981'}33`, color: team.color || 'var(--green-primary)' }}>
                      {p.jerseyNo || (p.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.name}
                        {p.isCaptain && <span className="badge badge-gold" style={{ fontSize: 10 }}>C</span>}
                        {p.isWK && <span className="badge badge-blue" style={{ fontSize: 10 }}>WK</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {p.role} {p.battingStyle && `• ${p.battingStyle}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Batting stats */}
            <section>
              <div className="section-header">
                <h2 className="section-title">🏏 Top Batsmen</h2>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {topBatsmen.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No batting data yet</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Player</th><th>Inn</th><th>Runs</th><th>SR</th><th>4s</th><th>6s</th></tr></thead>
                    <tbody>
                      {topBatsmen.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                          <td>{p.innings}</td>
                          <td style={{ fontFamily: 'Oswald', fontWeight: 700, color: 'var(--green-primary)' }}>{p.runs}</td>
                          <td>{p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—'}</td>
                          <td>{p.fours}</td>
                          <td>{p.sixes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Match History */}
          <section>
            <div className="section-header">
              <h2 className="section-title">📋 Match History</h2>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {teamMatches.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No matches yet. <Link href="/matches" style={{ color: 'var(--green-primary)' }}>Schedule one →</Link>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Match</th><th>Date</th><th>Format</th><th>Score</th><th>Result</th><th></th></tr>
                  </thead>
                  <tbody>
                    {teamMatches.slice().reverse().map(match => {
                      const isTeam1 = match.team1Id === id;
                      const oppId = isTeam1 ? match.team2Id : match.team1Id;
                      const oppTeam = teams.find(t => t.id === oppId) || { name: 'Unknown' };
                      const myInnings = isTeam1 ? match.innings[0] : match.innings[1];
                      const won = match.result?.winner === id;
                      return (
                        <tr key={match.id}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>vs {oppTeam.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{match.date || '—'}</td>
                          <td><span className="badge badge-gray">{match.format}</span></td>
                          <td style={{ fontFamily: 'Oswald' }}>{myInnings?.runs || 0}/{myInnings?.wickets || 0}</td>
                          <td>
                            {match.status === 'upcoming' ? <span className="badge badge-gray">Upcoming</span>
                              : match.status === 'live' ? <span className="badge badge-green">Live</span>
                              : match.result ? <span className={`badge badge-${won ? 'green' : 'red'}`}>{won ? 'Won' : 'Lost'}</span>
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/matches/${match.id}`} className="btn btn-secondary btn-sm">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <PlayerStatsModal 
          player={selectedPlayer} 
          matches={matches} 
          onClose={() => setSelectedPlayer(null)} 
        />
      </main>
    </div>
  );
}

function PlayerStatsModal({ player, matches, onClose }) {
  if (!player) return null;

  // Calculate stats
  const batting = { innings: 0, runs: 0, highest: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, balls: 0, notOuts: 0, recent: [] };
  const bowling = { innings: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, bestWickets: 0, bestRuns: 0, fiveW: 0, recent: [] };
  const fielding = { catches: 0, stumpings: 0, runOuts: 0 };
  let matchesPlayed = 0;

  matches.filter(m => m.status === 'completed').forEach(m => {
    let played = false;
    
    m.innings.forEach(inn => {
      // Batting
      const bat = inn.batting.find(b => b.id === player.id);
      if (bat) {
        played = true;
        if (bat.balls > 0) {
          batting.innings++;
          batting.runs += bat.runs || 0;
          batting.balls += bat.balls || 0;
          batting.fours += bat.fours || 0;
          batting.sixes += bat.sixes || 0;
          if (!bat.isOut) batting.notOuts++;
          if (bat.runs > batting.highest) batting.highest = bat.runs;
          if (bat.runs >= 100) batting.hundreds++;
          else if (bat.runs >= 50) batting.fifties++;
          batting.recent.push(bat.runs + (!bat.isOut ? '*' : ''));
        }
      }
      // Bowling
      const bowl = inn.bowling.find(b => b.id === player.id);
      if (bowl) {
        played = true;
        bowling.innings++;
        bowling.balls += bowl.balls || 0;
        bowling.runs += bowl.runs || 0;
        bowling.wickets += bowl.wickets || 0;
        bowling.maidens += bowl.maidens || 0;
        if (bowl.wickets > bowling.bestWickets || (bowl.wickets === bowling.bestWickets && bowl.runs < bowling.bestRuns) || bowling.bestRuns === 0) {
          bowling.bestWickets = bowl.wickets;
          bowling.bestRuns = bowl.runs;
        }
        if (bowl.wickets >= 5) bowling.fiveW++;
        bowling.recent.push(`${bowl.wickets}-${bowl.runs}`);
      }
      // Fielding
      inn.batting.filter(b => b.isOut && b.fielderId === player.id).forEach(b => {
        played = true;
        if (b.dismissal === 'caught') fielding.catches++;
        if (b.dismissal === 'stumped') fielding.stumpings++;
        if (b.dismissal === 'runout') fielding.runOuts++;
      });
    });

    if (played) matchesPlayed++;
  });

  const avg = batting.innings - batting.notOuts > 0 ? (batting.runs / (batting.innings - batting.notOuts)).toFixed(2) : '-';
  const sr = batting.balls > 0 ? ((batting.runs / batting.balls) * 100).toFixed(2) : '-';
  const econ = bowling.balls > 0 ? ((bowling.runs / bowling.balls) * 6).toFixed(2) : '-';
  const bowlAvg = bowling.wickets > 0 ? (bowling.runs / bowling.wickets).toFixed(2) : '-';

  return (
    <Modal open={!!player} onClose={onClose} title={`Player Stats`} size="lg">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--green-primary)' }}>
          {player.jerseyNo || player.name[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Oswald' }}>{player.name}</div>
          <div style={{ color: 'var(--text-muted)' }}>{player.role} {player.battingStyle && `• ${player.battingStyle}`} {player.bowlingStyle && `• ${player.bowlingStyle}`}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Form */}
        <div className="card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Form (Last 5)</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>BATTING</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {batting.recent.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>-</span> : batting.recent.slice(-5).map((s, i) => <span key={i} className="badge badge-gray">{s}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>BOWLING</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {bowling.recent.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>-</span> : bowling.recent.slice(-5).map((s, i) => <span key={i} className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red-light)' }}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Batting Stats */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--gold-light)' }}>🏏 Batting & Fielding</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>M</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{matchesPlayed}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>INN</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{batting.innings}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RUNS</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700, color: 'var(--gold-light)' }}>{batting.runs}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HS</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{batting.highest}{batting.notOuts > 0 ? '*' : ''}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AVG</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{avg}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SR</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{sr}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>50/100</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{batting.fifties}/{batting.hundreds}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>4s/6s</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{batting.fours}/{batting.sixes}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Fielding: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fielding.catches}</span> catches, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fielding.runOuts}</span> run outs, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fielding.stumpings}</span> stumpings
          </div>
        </div>

        {/* Bowling Stats */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--green-primary)' }}>⚾ Bowling</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>INN</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{bowling.innings}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>OVERS</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{Math.floor(bowling.balls / 6)}.{bowling.balls % 6}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>WKTS</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700, color: 'var(--green-primary)' }}>{bowling.wickets}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BBI</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{bowling.bestWickets > 0 ? `${bowling.bestWickets}/${bowling.bestRuns}` : '-'}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ECON</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{econ}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AVG</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{bowlAvg}</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>5W</div>
              <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{bowling.fiveW}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
