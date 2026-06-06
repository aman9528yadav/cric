'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useCricket } from '../../store/cricketStore';
import { formatOvers } from '../../components/ui';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, teams, matches } = useCricket();
  const [tab, setTab] = useState('matches');

  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: 32 }}>
          <div style={{ color: 'var(--text-muted)' }}>Tournament not found. <Link href="/tournaments">← Back</Link></div>
        </div>
      </main>
    </div>
  );

  const tournamentMatches = matches.filter(m => m.tournamentId === id);
  // Auto-include teams that have matches in this tournament, plus manually added teams
  const teamIds = new Set([
    ...(tournament.teams || []),
    ...tournamentMatches.map(m => m.team1Id),
    ...tournamentMatches.map(m => m.team2Id),
  ].filter(Boolean));
  const tournamentTeams = Array.from(teamIds).map(tid => teams.find(t => t.id === tid)).filter(Boolean);

  // Points table calculation
  const pointsTable = tournamentTeams.map(team => {
    const played = tournamentMatches.filter(m =>
      m.status === 'completed' && (m.team1Id === team.id || m.team2Id === team.id)
    );
    const won = played.filter(m => m.result?.winner === team.id).length;
    const tied = played.filter(m => !m.result?.winner).length;
    const lost = played.length - won - tied;
    const ptsWin = tournament.tier === 'premium' && tournament.pointsPerWin !== undefined ? tournament.pointsPerWin : 2;
    const ptsTie = tournament.tier === 'premium' && tournament.pointsPerTie !== undefined ? tournament.pointsPerTie : 1;
    const points = (won * ptsWin) + (tied * ptsTie);
    const nrr = calcNRR(team.id, played);
    return { team, played: played.length, won, lost, tied, points, nrr };
  }).sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  // Player Stats calculation
  const playerStatsMap = {};
  tournamentMatches.filter(m => m.status === 'completed').forEach(m => {
    m.innings.forEach(inn => {
      // Batting
      inn.batting.forEach(b => {
        if (!playerStatsMap[b.id]) playerStatsMap[b.id] = { id: b.id, name: b.name, teamId: inn.teamId, runs: 0, wickets: 0, points: 0 };
        playerStatsMap[b.id].runs += b.runs;
        playerStatsMap[b.id].points += b.runs; // 1 pt per run
      });
      // Bowling
      inn.bowling.forEach(b => {
        const bowlTeamId = inn.teamId === m.team1Id ? m.team2Id : m.team1Id;
        if (!playerStatsMap[b.id]) playerStatsMap[b.id] = { id: b.id, name: b.name, teamId: bowlTeamId, runs: 0, wickets: 0, points: 0 };
        playerStatsMap[b.id].wickets += b.wickets;
        playerStatsMap[b.id].points += (b.wickets * 10); // 10 pts per wicket
      });
    });
  });

  const playersArr = Object.values(playerStatsMap);
  const orangeCap = [...playersArr].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const purpleCap = [...playersArr].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  const mvp = [...playersArr].sort((a, b) => b.points - a.points).slice(0, 5);

  const hasKnockouts = tournamentMatches.some(m => ['Quarter-Final', 'Semi-Final', 'Final'].includes(m.stage));
  const finalMatch = tournamentMatches.find(m => m.stage === 'Final' && m.status === 'completed');
  const isTournamentOver = !!finalMatch;
  const championTeam = finalMatch?.result?.winner ? teams.find(t => t.id === finalMatch.result.winner) : null;

  const [isExporting, setIsExporting] = useState(false);
  const handleExportPDF = async () => {
    const element = document.getElementById('tournament-export-content');
    if (!element) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${tournament.name.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
      alert('Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <button className="mobile-back-btn" onClick={() => router.back()} title="Go Back">←</button>
            <div>
              <div className="desktop-breadcrumb" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <Link href="/tournaments" style={{ color: 'var(--green-primary)', textDecoration: 'none' }}>← Tournaments</Link>
              </div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span>🏆 {tournament.name}</span>
              {tournament.tier === 'premium' && (
                <span className="badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 11, padding: '4px 10px' }}>🌟 PREMIUM</span>
              )}
              {championTeam && (
                <span style={{ fontSize: 16, color: 'var(--gold-light)', fontWeight: 500, background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                  Won by {championTeam.name}
                </span>
              )}
            </h1>
            <div className="page-subtitle">
              {tournament.format} • {tournament.startDate || 'TBD'} {tournament.endDate && `→ ${tournament.endDate}`}
            </div>
          </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!championTeam && (
              <span className={`badge badge-${tournament.status === 'ongoing' ? 'green' : tournament.status === 'completed' ? 'blue' : 'gray'}`} style={{ fontSize: 13 }}>
                {tournament.status}
              </span>
            )}
            {!isTournamentOver && (
              <Link href={`/matches/new?tournamentId=${id}`} className="btn btn-primary">+ Schedule Match</Link>
            )}
            <button 
              className="btn btn-secondary" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? 'Generating PDF...' : '📄 Export to PDF'}
            </button>
          </div>
        </div>

        <div className="page-body" id="tournament-export-content" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0', background: 'var(--bg-main)' }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: -8 }}>
            <button className={`tab ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>🏏 Matches</button>
            <button className={`tab ${tab === 'standings' ? 'active' : ''}`} onClick={() => setTab('standings')}>📊 Standings</button>
            <button className={`tab ${tab === 'teams' ? 'active' : ''}`} onClick={() => setTab('teams')}>👥 Teams</button>
            <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>🔥 Stats</button>
            {hasKnockouts && <button className={`tab ${tab === 'knockouts' ? 'active' : ''}`} onClick={() => setTab('knockouts')}>🏆 Knockouts</button>}
          </div>

          {tab === 'knockouts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {['Quarter-Final', 'Semi-Final', 'Final'].map(stage => {
                const stageMatches = tournamentMatches.filter(m => m.stage === stage);
                if (stageMatches.length === 0) return null;
                return (
                  <section key={stage}>
                    <div className="section-header">
                      <h2 className="section-title">{stage}s</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stageMatches.map(match => <MatchRow key={match.id} match={match} teams={teams} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {tab === 'standings' && (
            <>
              {/* Points Table */}
              <section>
                <div className="section-header">
                  <h2 className="section-title">📊 Points Table</h2>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {pointsTable.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                      No teams in this tournament yet
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Team</th>
                          <th>P</th>
                          <th>W</th>
                          <th>L</th>
                          <th>T</th>
                          <th>Pts</th>
                          <th>NRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointsTable.map((row, i) => (
                          <tr key={row.team.id} style={{
                            borderBottom: (tournament.tier === 'premium' && tournament.qualifyingCount && i === tournament.qualifyingCount - 1) 
                              ? '2px dashed var(--gold-light)' : undefined
                          }}>
                            <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 6,
                                  background: `linear-gradient(135deg, ${row.team.color || '#10b981'}, ${row.team.color || '#059669'}aa)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, fontFamily: 'Oswald',
                                }}>
                                  {(row.team.shortName || row.team.name)[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14 }}>{row.team.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.team.shortName}</div>
                                </div>
                              </div>
                            </td>
                            <td>{row.played}</td>
                            <td style={{ color: 'var(--green-primary)', fontWeight: 600 }}>{row.won}</td>
                            <td style={{ color: 'var(--red-light)' }}>{row.lost}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{row.tied}</td>
                            <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--gold-light)' }}>{row.points}</td>
                            <td style={{ color: row.nrr >= 0 ? 'var(--green-primary)' : 'var(--red-light)', fontWeight: 600 }}>
                              {row.nrr >= 0 ? '+' : ''}{row.nrr.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'matches' && (
            <>
          {/* Matches */}
          <section>
            <div className="section-header">
              <h2 className="section-title">🏏 Matches</h2>
              <Link href={`/matches/new?tournamentId=${id}`} className="btn btn-secondary btn-sm">+ Add Match</Link>
            </div>
            {tournamentMatches.length === 0 ? (
              <div className="card">
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No matches scheduled yet
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tournamentMatches.map(match => (
                  <MatchRow key={match.id} match={match} teams={teams} />
                ))}
              </div>
            )}
          </section>

          </>
          )}

          {tab === 'teams' && (
            <section>
              <div className="section-header">
                <h2 className="section-title">👥 Participating Teams</h2>
              </div>
              <div className="grid-4">
                {tournamentTeams.map(team => (
                  <Link key={team.id} href={`/teams/${team.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `linear-gradient(135deg, ${team.color || '#10b981'}, ${team.color || '#059669'}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Oswald', fontSize: 16, fontWeight: 700,
                      }}>{(team.shortName || team.name)[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{team.players?.length || 0} players</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {tab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <section>
                <div className="section-header">
                  <h2 className="section-title">🔥 Tournament Stats</h2>
                </div>
                <div className="grid-3">
                  {/* Orange Cap */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>🟠</span>
                      <h3 style={{ fontFamily: 'Oswald', fontSize: 18, margin: 0, color: 'var(--gold-light)' }}>Orange Cap</h3>
                    </div>
                    {orangeCap.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No stats yet</div> : (
                      <table className="data-table">
                        <thead><tr><th>Player</th><th>Runs</th></tr></thead>
                        <tbody>
                          {orangeCap.map((p, i) => (
                            <tr key={p.id}>
                              <td>{i+1}. {p.name} <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{teams.find(t => t.id === p.teamId)?.shortName}</div></td>
                              <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>{p.runs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* Purple Cap */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>🟣</span>
                      <h3 style={{ fontFamily: 'Oswald', fontSize: 18, margin: 0, color: 'var(--gold-light)' }}>Purple Cap</h3>
                    </div>
                    {purpleCap.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No stats yet</div> : (
                      <table className="data-table">
                        <thead><tr><th>Player</th><th>Wickets</th></tr></thead>
                        <tbody>
                          {purpleCap.map((p, i) => (
                            <tr key={p.id}>
                              <td>{i+1}. {p.name} <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{teams.find(t => t.id === p.teamId)?.shortName}</div></td>
                              <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>{p.wickets}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* MVP */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>⭐</span>
                      <h3 style={{ fontFamily: 'Oswald', fontSize: 18, margin: 0, color: 'var(--gold-light)' }}>MVP Rating</h3>
                    </div>
                    {mvp.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No stats yet</div> : (
                      <table className="data-table">
                        <thead><tr><th>Player</th><th>Points</th></tr></thead>
                        <tbody>
                          {mvp.map((p, i) => (
                            <tr key={p.id}>
                              <td>{i+1}. {p.name} <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{teams.find(t => t.id === p.teamId)?.shortName}</div></td>
                              <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--green-primary)' }}>{p.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function MatchRow({ match, teams }) {
  const t1 = teams.find(t => t.id === match.team1Id);
  const t2 = teams.find(t => t.id === match.team2Id);
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const statusColor = match.status === 'live' ? 'green' : match.status === 'completed' ? 'blue' : 'gray';

  return (
    <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <span className={`badge badge-${statusColor}`} style={{ minWidth: 80, justifyContent: 'center' }}>
          {match.status === 'live' ? '🔴 LIVE' : match.status}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
            {t1?.name || 'TBD'} vs {t2?.name || 'TBD'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {match.format} {match.date && `• ${match.date}`} {match.venue && `• ${match.venue}`}
          </div>
        </div>
        {match.status !== 'upcoming' && (
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
            <div>{inn1?.runs}/{inn1?.wickets} ({formatOvers(inn1?.balls || 0)})</div>
            <div>{inn2?.runs || 0}/{inn2?.wickets || 0} ({formatOvers(inn2?.balls || 0)})</div>
          </div>
        )}
        {match.result && (
          <div style={{ fontSize: 12, color: 'var(--green-primary)', fontWeight: 600 }}>
            {match.result.winner
              ? `${teams.find(t => t.id === match.result.winner)?.shortName} won`
              : 'Tie'}
          </div>
        )}
      </div>
    </Link>
  );
}

function calcNRR(teamId, matches) {
  let runsScored = 0, oversScored = 0, runsConceded = 0, oversConceded = 0;
  matches.forEach(m => {
    // If match is a tie, user requested it to contribute 0 to NRR, so we skip it
    if (!m.result?.winner) return; 
    
    const isBatFirst = m.innings[0]?.teamId === teamId;
    const myInnings = isBatFirst ? m.innings[0] : m.innings[1];
    const oppInnings = isBatFirst ? m.innings[1] : m.innings[0];
    if (myInnings) { runsScored += myInnings.runs; oversScored += myInnings.balls / 6; }
    if (oppInnings) { runsConceded += oppInnings.runs; oversConceded += oppInnings.balls / 6; }
  });
  if (oversScored === 0 || oversConceded === 0) return 0;
  return (runsScored / oversScored) - (runsConceded / oversConceded);
}

