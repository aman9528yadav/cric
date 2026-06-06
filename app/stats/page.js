'use client';
import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useCricket } from '../store/cricketStore';
import Link from 'next/link';

export default function StatsHubPage() {
  const { matches, teams } = useCricket();
  const [tab, setTab] = useState('players');

  // All-time player stats
  const allTimeStats = useMemo(() => {
    const map = {};
    matches.filter(m => m.status === 'completed').forEach(m => {
      m.innings.forEach(inn => {
        inn.batting.forEach(b => {
          if (!map[b.id]) map[b.id] = { id: b.id, name: b.name, runs: 0, wickets: 0, highest: 0, matches: 0, teamIds: new Set(), recentBatting: [], recentBowling: [] };
          map[b.id].runs += b.runs;
          if (b.runs > map[b.id].highest) map[b.id].highest = b.runs;
          map[b.id].teamIds.add(inn.teamId);
          map[b.id].recentBatting.push(b.runs + (b.isOut ? '' : '*'));
        });
        inn.bowling.forEach(b => {
          const bowlTeamId = inn.teamId === m.team1Id ? m.team2Id : m.team1Id;
          if (!map[b.id]) map[b.id] = { id: b.id, name: b.name, runs: 0, wickets: 0, highest: 0, matches: 0, teamIds: new Set(), recentBatting: [], recentBowling: [] };
          map[b.id].wickets += b.wickets;
          map[b.id].teamIds.add(bowlTeamId);
          map[b.id].recentBowling.push(`${b.wickets}-${b.runs}`);
        });
      });
      
      // Match counting is a bit tricky, just use a simplistic approach
      [...m.innings[0]?.batting || [], ...m.innings[0]?.bowling || [], ...m.innings[1]?.batting || [], ...m.innings[1]?.bowling || []].forEach(p => {
         if (map[p.id]) map[p.id].matches += 0.25; // approximated
      });
    });

    return Object.values(map).map(p => ({
      ...p,
      matches: Math.ceil(p.matches),
      teams: Array.from(p.teamIds).map(id => teams.find(t => t.id === id)?.shortName).filter(Boolean).join(', '),
      recentBatting: p.recentBatting.slice(-5),
      recentBowling: p.recentBowling.slice(-5),
    }));
  }, [matches, teams]);

  const topRunScorers = [...allTimeStats].sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topWicketTakers = [...allTimeStats].sort((a, b) => b.wickets - a.wickets).slice(0, 10);

  // Head-to-Head Matchups
  const headToHead = useMemo(() => {
    const map = {};
    matches.filter(m => m.status === 'completed' && m.result).forEach(m => {
      const [t1, t2] = [m.team1Id, m.team2Id].sort();
      const key = `${t1}-${t2}`;
      if (!map[key]) {
        map[key] = {
          team1Id: t1, team2Id: t2,
          team1Name: teams.find(t => t.id === t1)?.name || t1,
          team2Name: teams.find(t => t.id === t2)?.name || t2,
          matches: 0, team1Wins: 0, team2Wins: 0, ties: 0
        };
      }
      map[key].matches += 1;
      if (m.result.winner === t1) map[key].team1Wins += 1;
      else if (m.result.winner === t2) map[key].team2Wins += 1;
      else map[key].ties += 1;
    });
    return Object.values(map).sort((a, b) => b.matches - a.matches);
  }, [matches, teams]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">📈 Global Stats Hub</h1>
            <div className="page-subtitle">All-time player statistics and head-to-head records</div>
          </div>
        </div>

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="tabs">
            <button className={`tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>🏏 Player Stats</button>
            <button className={`tab ${tab === 'h2h' ? 'active' : ''}`} onClick={() => setTab('h2h')}>⚔️ Head-to-Head</button>
          </div>

          {tab === 'players' && (
            <div className="grid-2">
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>🏏</span>
                  <h2 style={{ fontFamily: 'Oswald', fontSize: 20, margin: 0 }}>Top Run Scorers</h2>
                </div>
                <table className="data-table">
                  <thead><tr><th>Player</th><th>Teams</th><th>Recent Form</th><th>Runs</th><th>HS</th></tr></thead>
                  <tbody>
                    {topRunScorers.map((p, i) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{i + 1}. {p.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.teams}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {p.recentBatting.map((score, idx) => (
                              <span key={idx} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: 11, fontFamily: 'Oswald' }}>{score}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--gold-light)' }}>{p.runs}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.highest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topRunScorers.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No data available.</div>}
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>⚾</span>
                  <h2 style={{ fontFamily: 'Oswald', fontSize: 20, margin: 0 }}>Top Wicket Takers</h2>
                </div>
                <table className="data-table">
                  <thead><tr><th>Player</th><th>Teams</th><th>Recent Form</th><th>Wickets</th></tr></thead>
                  <tbody>
                    {topWicketTakers.map((p, i) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{i + 1}. {p.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.teams}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {p.recentBowling.map((fig, idx) => (
                              <span key={idx} style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.05)', color: 'var(--red-light)', borderRadius: 4, fontSize: 11, fontFamily: 'Oswald' }}>{fig}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700, color: 'var(--gold-light)' }}>{p.wickets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topWicketTakers.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No data available.</div>}
              </div>
            </div>
          )}

          {tab === 'h2h' && (
            <div className="card">
              <h2 className="section-title">Head-to-Head Records</h2>
              <table className="data-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Matchup</th><th>Matches</th><th>Team 1 Wins</th><th>Team 2 Wins</th><th>Ties</th></tr></thead>
                <tbody>
                  {headToHead.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.team1Name} <span style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 8px' }}>vs</span> {h.team2Name}</td>
                      <td>{h.matches}</td>
                      <td style={{ color: h.team1Wins > h.team2Wins ? 'var(--green-primary)' : 'inherit' }}>{h.team1Wins}</td>
                      <td style={{ color: h.team2Wins > h.team1Wins ? 'var(--green-primary)' : 'inherit' }}>{h.team2Wins}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{h.ties}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {headToHead.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No data available.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
