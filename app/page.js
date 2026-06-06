'use client';
import Sidebar from './components/Sidebar';
import { useCricket } from './store/cricketStore';
import { StatCard, TeamAvatar } from './components/ui';
import Link from 'next/link';
import { formatOvers, calcRunRate } from './components/ui';

export default function Dashboard() {
  const { tournaments, teams, matches, loaded } = useCricket();

  if (!loaded) return <div style={{ display: 'flex' }}><Sidebar /><main className="main-content"><div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading...</div></main></div>;

  const liveMatches = matches.filter(m => m.status === 'live');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const activeTournaments = tournaments.filter(t => t.status === 'ongoing');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-subtitle">Welcome to CricManager — your cricket command center</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/matches/new" className="btn btn-primary">+ New Match</Link>
          </div>
        </div>

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Stats */}
          <div className="grid-4">
            <StatCard icon="🏆" value={tournaments.length} label="Tournaments" color="gold" />
            <StatCard icon="👥" value={teams.length} label="Teams" color="blue" />
            <StatCard icon="🏏" value={matches.length} label="Total Matches" color="green" />
            <StatCard icon="🔴" value={liveMatches.length} label="Live Now" color="red" />
          </div>

          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">
                  <span className="live-dot" style={{ display: 'inline-block' }}></span>
                  Live Matches
                </h2>
              </div>
              <div className="grid-2">
                {liveMatches.map(match => (
                  <LiveMatchCard key={match.id} match={match} teams={teams} />
                ))}
              </div>
            </section>
          )}

          {/* Recent + Upcoming */}
          <div className="grid-2">
            {/* Recent Results */}
            <section>
              <div className="section-header">
                <h2 className="section-title">📋 Recent Results</h2>
                <Link href="/matches" className="btn btn-secondary btn-sm">View All</Link>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {completedMatches.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No completed matches yet
                  </div>
                ) : (
                  completedMatches.slice(-5).reverse().map(match => (
                    <RecentMatchRow key={match.id} match={match} teams={teams} />
                  ))
                )}
              </div>
            </section>

            {/* Upcoming */}
            <section>
              <div className="section-header">
                <h2 className="section-title">📅 Upcoming Matches</h2>
                <Link href="/matches/new" className="btn btn-primary btn-sm">+ Schedule</Link>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {upcomingMatches.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No upcoming matches
                  </div>
                ) : (
                  upcomingMatches.slice(0, 5).map(match => (
                    <UpcomingMatchRow key={match.id} match={match} teams={teams} />
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Tournaments */}
          <section>
            <div className="section-header">
              <h2 className="section-title">🏆 Tournaments</h2>
              <Link href="/tournaments" className="btn btn-secondary btn-sm">Manage</Link>
            </div>
            {tournaments.length === 0 ? (
              <div className="card">
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No tournaments yet. <Link href="/tournaments" style={{ color: 'var(--green-primary)' }}>Create one →</Link>
                </div>
              </div>
            ) : (
              <div className="grid-3">
                {tournaments.slice(0, 6).map(t => (
                  <TournamentCard key={t.id} tournament={t} matches={matches} />
                ))}
              </div>
            )}
          </section>

          {/* Teams */}
          <section>
            <div className="section-header">
              <h2 className="section-title">👥 Teams</h2>
              <Link href="/teams" className="btn btn-secondary btn-sm">Manage</Link>
            </div>
            {teams.length === 0 ? (
              <div className="card">
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No teams yet. <Link href="/teams" style={{ color: 'var(--green-primary)' }}>Add teams →</Link>
                </div>
              </div>
            ) : (
              <div className="grid-4">
                {teams.slice(0, 8).map(t => (
                  <TeamCard key={t.id} team={t} matches={matches} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function LiveMatchCard({ match, teams }) {
  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);
  const inningsIdx = match.currentInnings;
  const innings = match.innings[inningsIdx];
  const bowlingTeamId = innings?.teamId === match.team1Id ? match.team2Id : match.team1Id;

  return (
    <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none' }}>
      <div className="live-score-banner card" style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 8 }}>
              <span className="live-dot" style={{ display: 'inline-block', width: 6, height: 6 }}></span>
              LIVE
            </span>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{match.format || 'T20'} • Over {formatOvers(innings?.balls || 0)}</div>
          </div>
          <span className="badge badge-gray">{match.venue || 'TBD'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <TeamAvatar team={innings?.teamId === match.team1Id ? team1 : team2} />
          <div>
            <div style={{ fontFamily: 'Oswald', fontSize: 15, fontWeight: 600 }}>
              {innings?.teamId === match.team1Id ? team1?.name : team2?.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Batting</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="score-display" style={{ fontSize: 36 }}>
              {innings?.runs || 0}
              <span>/{innings?.wickets || 0}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--green-primary)' }}>
              CRR: {calcRunRate(innings?.runs || 0, innings?.balls || 0)}
            </div>
          </div>
        </div>

        {inningsIdx === 1 && match.innings[0] && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            Target: {match.innings[0].runs + 1} • Need {Math.max(0, match.innings[0].runs + 1 - (innings?.runs || 0))} runs
          </div>
        )}
      </div>
    </Link>
  );
}

function RecentMatchRow({ match, teams }) {
  const t1 = teams.find(t => t.id === match.team1Id);
  const t2 = teams.find(t => t.id === match.team2Id);
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  return (
    <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none' }}>
      <div className="info-row" style={{ padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t1?.shortName || t1?.name} vs {t2?.shortName || t2?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {match.format} {match.venue && `• ${match.venue}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {inn1?.runs}/{inn1?.wickets} vs {inn2?.runs}/{inn2?.wickets}
          </div>
          {match.result && (
            <div style={{ fontSize: 11, color: 'var(--green-primary)', marginTop: 2 }}>
              {match.result.winner
                ? `${teams.find(t => t.id === match.result.winner)?.shortName || 'Team'} won by ${match.result.margin}`
                : 'Tie'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function UpcomingMatchRow({ match, teams }) {
  const t1 = teams.find(t => t.id === match.team1Id);
  const t2 = teams.find(t => t.id === match.team2Id);

  return (
    <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none' }}>
      <div className="info-row" style={{ padding: '12px 16px', cursor: 'pointer' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t1?.name || 'TBD'} vs {t2?.name || 'TBD'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {match.format} {match.date && `• ${match.date}`}
          </div>
        </div>
        <span className="badge badge-blue">Upcoming</span>
      </div>
    </Link>
  );
}

function TournamentCard({ tournament, matches }) {
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
  const completed = tournamentMatches.filter(m => m.status === 'completed').length;
  const statusColors = { upcoming: 'gray', ongoing: 'green', completed: 'blue' };

  return (
    <Link href={`/tournaments/${tournament.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 24 }}>🏆</div>
          <span className={`badge badge-${statusColors[tournament.status] || 'gray'}`}>
            {tournament.status}
          </span>
        </div>
        <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {tournament.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {tournament.format} • {tournament.teams?.length || 0} teams
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: tournamentMatches.length > 0
              ? `${(completed / tournamentMatches.length) * 100}%`
              : '0%'
          }}></div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {completed}/{tournamentMatches.length} matches played
        </div>
      </div>
    </Link>
  );
}

function TeamCard({ team, matches }) {
  const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
  const wins = matches.filter(m => m.result?.winner === team.id).length;

  return (
    <Link href={`/teams/${team.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div
            className="team-avatar"
            style={{
              background: `linear-gradient(135deg, ${team.color || '#10b981'}, ${team.color ? team.color + 'aa' : '#059669'})`,
            }}
          >
            {(team.shortName || team.name || '?')[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{team.shortName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{teamMatches.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Matches</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.08)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700, color: 'var(--green-primary)' }}>{wins}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>{team.players?.length || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Players</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
