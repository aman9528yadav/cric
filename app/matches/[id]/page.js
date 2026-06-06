'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useCricket } from '../../store/cricketStore';
import { formatOvers, calcRunRate, Toast, useToast, Modal } from '../../components/ui';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Handled Ball', 'Obstructing Field'];

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { matches, teams, startMatch, recordBall, undoBall, updateMatch, setNewBatsman, setBowler, setInningsLineup, applySubstitution } = useCricket();
  const { toast, show } = useToast();
  const [tab, setTab] = useState('score');
  const [showToss, setShowToss] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [showChangeBowler, setShowChangeBowler] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState(null);
  const [showLineup, setShowLineup] = useState(false);
  const [scorecardInnings, setScorecardInnings] = useState(0);
  const [showRainDelay, setShowRainDelay] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);

  const match = matches.find(m => m.id === id);
  if (!match) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: 32 }}>
          <div style={{ color: 'var(--text-muted)' }}>Match not found. <Link href="/matches">← Back</Link></div>
        </div>
      </main>
    </div>
  );

  const team1Raw = teams.find(t => t.id === match.team1Id);
  const team2Raw = teams.find(t => t.id === match.team2Id);

  // Apply playingXI filter if the match has started and playingXI is set
  const team1 = team1Raw ? {
    ...team1Raw,
    players: match.playingXI?.[team1Raw.id]?.length > 0 
      ? team1Raw.players.filter(p => match.playingXI[team1Raw.id].includes(p.id)) 
      : team1Raw.players
  } : null;
  
  const team2 = team2Raw ? {
    ...team2Raw,
    players: match.playingXI?.[team2Raw.id]?.length > 0 
      ? team2Raw.players.filter(p => match.playingXI[team2Raw.id].includes(p.id)) 
      : team2Raw.players
  } : null;

  const inningsIdx = match.currentInnings;
  const innings = match.innings[inningsIdx];
  const battingTeam = team1?.id === innings?.teamId ? team1 : team2;
  const bowlingTeamId = innings?.teamId === match.team1Id ? match.team2Id : match.team1Id;
  const bowlingTeam = team1?.id === bowlingTeamId ? team1 : team2;

  const striker = innings?.batting?.find(b => b.isStriker && !b.isOut);
  const nonStriker = innings?.batting?.find(b => b.isNonStriker && !b.isOut);

  // Determine current bowler
  const history = innings?.ballHistory || [];
  const lastBowlerId = history.length > 0 ? history[history.length - 1].bowlerId : null;
  const currentBowlerId = innings?.currentBowlerId;
  const currentBowler = innings?.bowling?.find(b => b.id === currentBowlerId) || null;

  // An over is complete ONLY if we have reached 6 balls AND a new bowler hasn't been selected yet
  const ballsInCurrentOver = (innings?.balls || 0) % 6;
  const overComplete = ballsInCurrentOver === 0 && (innings?.balls || 0) > 0 && currentBowlerId === lastBowlerId;

  // Check if need new batsman
  const maxWickets = Math.max(1, (battingTeam?.players?.length || 11) - 1);
  const needNewBatsman = match.status === 'live' && innings?.wickets > 0 &&
    (!striker || !nonStriker) && innings.wickets < maxWickets;

  // Check if need bowler (over complete)
  const needBowler = match.status === 'live' && overComplete;

  // Ball delivery handler
  const handleDelivery = (type, runs = 0) => {
    if (match.status !== 'live') return;

    // Block scoring if over is complete and bowler not yet changed
    if (overComplete) {
      show('Over complete! Select a new bowler to continue.', 'error');
      setShowChangeBowler(true);
      return;
    }

    if (!currentBowler && (innings?.balls || 0) > 0) {
      show('Please select a bowler first', 'error');
      setShowChangeBowler(true);
      return;
    }
    if (type === 'wicket') {
      setPendingDelivery({ type: 'wicket', runs, bowlerId: currentBowler?.id });
      setShowWicketModal(true);
    } else {
      recordBall(id, { type, runs, bowlerId: currentBowler?.id });
      
      const isLegal = !['wide', 'noball'].includes(type);
      const newBalls = isLegal ? (innings?.balls || 0) + 1 : (innings?.balls || 0);
      const isOversCompleted = newBalls >= (match.totalOvers || 20) * 6;
      
      const target = inningsIdx === 1 ? match.innings[0].runs + 1 : null;
      // Approximate run calc (ignores extras logic intricacies, but good enough to prevent popup)
      const newRuns = innings.runs + runs; 
      const chaseComplete = target && newRuns >= target;
      
      if (!isOversCompleted && !chaseComplete && isLegal) {
        if (newBalls % 6 === 0 && newBalls > 0 && match.status !== 'completed') {
          show(`Over ${Math.floor(newBalls / 6)} complete! Select next bowler.`, 'success');
          setTimeout(() => setShowChangeBowler(true), 300);
        } else {
          if (runs === 6) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#d97706'] });
          show(runs === 4 ? '🟢 FOUR!' : runs === 6 ? '🌟 SIX!' : `${runs} run${runs !== 1 ? 's' : ''}`, 'info');
        }
      } else if (!isLegal) {
        show(type === 'wide' ? '⚠️ Wide!' : '⚠️ No Ball!', 'info');
      }
    }
  };

  const handleWicket = (dismissalType, fielderId) => {
    recordBall(id, {
      ...pendingDelivery,
      dismissalType: dismissalType.toLowerCase().replace(' ', ''),
      fielderId,
    });
    setShowWicketModal(false);
    setPendingDelivery(null);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#ef4444', '#dc2626', '#b91c1c'] });
    show('Wicket!!! 🎉', 'success');
    
    const newBalls = (innings?.balls || 0) + 1;
    const isOversCompleted = newBalls >= (match.totalOvers || 20) * 6;
    const maxWickets = Math.max(1, (battingTeam?.players?.length || 11) - 1);
    const isAllOut = (innings?.wickets + 1) >= maxWickets;

    if (!isOversCompleted && !isAllOut) {
      if (newBalls % 6 === 0 && newBalls > 0) {
        setTimeout(() => setShowNewBatsman(true), 100);
      } else {
        setShowNewBatsman(true);
      }
    }
  };

  const handleNewBatsman = (player) => {
    setNewBatsman(id, inningsIdx, player);
    setShowNewBatsman(false);
    show(`${player.name} is in!`, 'info');
  };

  const handleNewBowler = (player) => {
    setBowler(id, inningsIdx, player);
    setShowChangeBowler(false);
    show(`${player.name} is bowling`, 'info');
  };

  // Toss setup
  const handleTossSetup = (tossWinner, tossChoice, lineup, playingXI) => {
    const battingTeamId = tossChoice === 'bat' ? tossWinner : (tossWinner === match.team1Id ? match.team2Id : match.team1Id);
    const bowlingTeamId2 = battingTeamId === match.team1Id ? match.team2Id : match.team1Id;
    startMatch(id, {
      tossWinner,
      tossChoice,
      battingTeamId,
      bowlingTeamId: bowlingTeamId2,
      battingLineup: lineup.batting,
      bowlingLineup: lineup.bowling,
      playingXI,
    });
    setShowToss(false);
    show('Match started! 🏏', 'success');
  };

  // Over groups for ball history display
  const groupedOvers = [];
  if (innings?.ballHistory) {
    let over = [];
    let legalBalls = 0;
    innings.ballHistory.forEach(ball => {
      over.push(ball);
      if (!['wide', 'noball'].includes(ball.type)) legalBalls++;
      if (legalBalls === 6) {
        groupedOvers.push([...over]);
        over = [];
        legalBalls = 0;
      }
    });
    if (over.length > 0) groupedOvers.push(over);
  }

  const target = inningsIdx === 1 ? match.innings[0].runs + 1 : null;
  const needed = target ? Math.max(0, target - (innings?.runs || 0)) : null;

  const handleShare = async () => {
    const el = document.getElementById('scorecard-capture');
    if (!el) return;
    try {
      show('Capturing scorecard...', 'info');
      const canvas = await html2canvas(el, { backgroundColor: '#1e293b' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cricket-scorecard-${match.id}.png`;
      link.href = dataUrl;
      link.click();
      show('Scorecard saved!', 'success');
    } catch (err) {
      show('Failed to capture scorecard', 'error');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        {match.status === 'completed' ? (
          <div style={{ background: 'var(--bg-secondary)', padding: '32px', textAlign: 'center', marginBottom: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', left: -16, top: -16 }}>
                <button className="mobile-back-btn" onClick={() => router.back()} title="Go Back">←</button>
              </div>
              <div className="desktop-breadcrumb" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                <Link href="/matches" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Matches</Link> • {match.format} • {match.date || 'No Date'}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, marginBottom: 24 }}>
              {/* Team 1 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 16, background: `linear-gradient(135deg, ${team1?.color || '#334155'}, ${team1?.color || '#1e293b'}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'Oswald' }}>
                  {(team1?.shortName || team1?.name || '?')[0]}
                </div>
                <div style={{ fontFamily: 'Oswald', fontSize: 28, fontWeight: 700 }}>{match.innings[0]?.runs || 0}/{match.innings[0]?.wickets || 0}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>({formatOvers(match.innings[0]?.balls || 0)})</div>
                <div style={{ marginTop: 8, fontWeight: 600, fontSize: 16 }}>{team1?.shortName || team1?.name}</div>
              </div>

              {/* VS */}
              <div style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>VS</div>

              {/* Team 2 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 16, background: `linear-gradient(135deg, ${team2?.color || '#334155'}, ${team2?.color || '#1e293b'}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'Oswald' }}>
                  {(team2?.shortName || team2?.name || '?')[0]}
                </div>
                <div style={{ fontFamily: 'Oswald', fontSize: 28, fontWeight: 700 }}>{match.innings[1]?.runs || 0}/{match.innings[1]?.wickets || 0}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>({formatOvers(match.innings[1]?.balls || 0)})</div>
                <div style={{ marginTop: 8, fontWeight: 600, fontSize: 16 }}>{team2?.shortName || team2?.name}</div>
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-primary)' }}>
              {match.result?.winner ? `${teams.find(t => t.id === match.result.winner)?.name} won by ${match.result.margin}` : 'Match Tied'}
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleShare}>📸 Share Scorecard</button>
            </div>
          </div>
        ) : (
          <div className="page-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 className="title" style={{ margin: 0, fontSize: 24 }}>{team1?.name} vs {team2?.name}</h1>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                  {match.status === 'upcoming' ? 'Upcoming Match' : match.status === 'live' ? 'Live Match' : 'Match Completed'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {match.status === 'live' && (
                  <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowImpactModal(true)}>
                    <span>🔁</span> Impact Player
                  </button>
                )}
                <Link href="/matches" className="btn btn-secondary">← Back</Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {match.status === 'upcoming' && (
                <button className="btn btn-primary" onClick={() => setShowToss(true)}>▶ Start Match</button>
              )}
              {match.status === 'live' && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => undoBall(match.id)} disabled={!innings?.history?.length}>
                    ⏪ Undo Last Ball
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowRainDelay(true)}>
                    🌧️ Rain Delay
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowChangeBowler(true)}>
                    Change Bowler
                  </button>
                  <span className="badge badge-green" style={{ fontSize: 13 }}>
                    <span className="live-dot" style={{ display: 'inline-block' }}></span>
                    LIVE
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Need second innings lineup prompt */}
        {match.status === 'live' && inningsIdx === 1 && innings?.batting?.length === 0 && (
          <div style={{ margin: '0 32px 16px', padding: '16px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--gold-light)', marginBottom: 6 }}>2nd Innings — Set Batting Lineup</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {teams.find(t => t.id === innings.teamId)?.name} needs {target} to win
            </div>
            <button className="btn btn-gold" onClick={() => setShowLineup(true)}>Set Batting Order →</button>
          </div>
        )}

        <div className="page-body" id="scorecard-capture" style={{ padding: 32, margin: -32 }}>
          {/* Tabs */}
          <div style={{ marginBottom: 20 }}>
            <div className="tabs">
              {(match.status === 'completed' ? ['summary', 'scorecard_details', 'commentary'] : ['score', 'scorecard_details', 'commentary']).map(t => (
                <button key={t} className={`tab ${(tab === t || (tab === 'score' && t === 'summary')) ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t === 'summary' ? '📋 Summary' : t === 'score' ? '🎯 Live Scoring' : t === 'scorecard_details' ? '📊 Scorecard' : '💬 Commentary'}
                </button>
              ))}
            </div>
          </div>

          {/* ---- SUMMARY TAB ---- */}
          {(tab === 'summary' || (tab === 'score' && match.status === 'completed')) && (() => {
            const getPlayerOfTheMatch = () => {
              const pts = {};
              match.innings.forEach(inn => {
                inn.batting.forEach(b => {
                  if (!pts[b.id]) pts[b.id] = { id: b.id, name: b.name, teamId: inn.teamId, points: 0, desc: '' };
                  pts[b.id].points += b.runs;
                  pts[b.id].desc += `${b.runs}${b.isOut === false ? '*' : ''} (${b.balls})`;
                });
                inn.bowling.forEach(b => {
                  const bowlTeamId = inn.teamId === match.team1Id ? match.team2Id : match.team1Id;
                  if (!pts[b.id]) pts[b.id] = { id: b.id, name: b.name, teamId: bowlTeamId, points: 0, desc: '' };
                  pts[b.id].points += (b.wickets * 10);
                  if (b.wickets > 0) pts[b.id].desc += (pts[b.id].desc ? ' & ' : '') + `${b.wickets}/${b.runs} (${b.overs})`;
                });
              });
              return Object.values(pts).sort((a,b) => b.points - a.points)[0];
            };
            const pom = getPlayerOfTheMatch();
            const pomTeam = teams.find(t => t.id === pom?.teamId);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Player of the Match Banner */}
                {pom && (
                  <div style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 12, padding: '20px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.3)'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9, marginBottom: 4 }}>Player of the Match</div>
                      <div style={{ fontFamily: 'Oswald', fontSize: 24, fontWeight: 700 }}>
                        {pom.name} <span style={{ fontSize: 16, opacity: 0.8, fontWeight: 400 }}>({pomTeam?.shortName})</span>
                      </div>
                      <div style={{ fontSize: 15, opacity: 0.9, marginTop: 4 }}>{pom.desc}</div>
                    </div>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      🏆
                    </div>
                  </div>
                )}

                {/* Innings Summaries */}
                {[0, 1].map(idx => {
                  const inn = match.innings[idx];
                  if (!inn || inn.batting.length === 0) return null;
                  const battTeam = teams.find(t => t.id === inn.teamId);
                  const topBatters = [...inn.batting].sort((a,b) => b.runs - a.runs).slice(0, 3);
                  const topBowlers = [...inn.bowling].sort((a,b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 3);
                  
                  return (
                    <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: `linear-gradient(135deg, ${battTeam?.color || '#10b981'}, ${battTeam?.color || '#059669'}88)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Oswald', fontSize: 11, fontWeight: 700,
                          }}>{(battTeam?.shortName || battTeam?.name || '?')[0]}</div>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{battTeam?.name}</span>
                        </div>
                        <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700 }}>
                          {inn.runs}/{inn.wickets} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({formatOvers(inn.balls)})</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid var(--border)' }}>
                          {topBatters.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                              <div style={{ fontWeight: 600 }}>{b.name}</div>
                              <div><span style={{ fontWeight: 700 }}>{b.runs}</span> <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({b.balls})</span></div>
                            </div>
                          ))}
                        </div>
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          {topBowlers.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                              <div style={{ fontWeight: 600 }}>{b.name}</div>
                              <div><span style={{ fontWeight: 700 }}>{b.wickets}/{b.runs}</span> <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({b.overs})</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Footer Meta */}
                <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                  {match.tossWinner && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ color: 'var(--green-primary)' }}>Toss:</span> {teams.find(t => t.id === match.tossWinner)?.name} won the toss and decided to {match.tossChoice}
                    </div>
                  )}
                  {match.venue && (
                    <div><span style={{ color: 'var(--green-primary)' }}>Venue:</span> {match.venue}</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ---- SCORECARD TAB ---- */}
          {(tab === 'score' && match.status !== 'completed') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Live Score Banner */}
              {match.status !== 'upcoming' && (
                <div className="live-score-banner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `linear-gradient(135deg, ${battingTeam?.color || '#10b981'}, ${battingTeam?.color ? battingTeam.color + '88' : '#059669'})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Oswald', fontSize: 15, fontWeight: 700,
                        }}>{(battingTeam?.shortName || battingTeam?.name || '?')[0]}</div>
                        <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 700 }}>
                          {battingTeam?.name} — Innings {inningsIdx + 1}
                        </div>
                      </div>
                      <div className="score-display">
                        {innings?.runs || 0}
                        <span>/{innings?.wickets || 0}</span>
                      </div>
                      <div className="overs-display">
                        {formatOvers(innings?.balls || 0)} / {match.totalOvers} overs
                      </div>
                      <div className="crr-display" style={{ marginTop: 4 }}>
                        CRR: {calcRunRate(innings?.runs || 0, innings?.balls || 0)}
                        {target && ` • RRR: ${calcRunRate(needed, ((match.totalOvers * 6) - (innings?.balls || 0)))}`}
                      </div>
                    </div>

                    {target && (
                      <div style={{
                        background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '14px 20px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>TARGET</div>
                        <div style={{ fontFamily: 'Oswald', fontSize: 32, fontWeight: 700, color: 'var(--gold-light)' }}>{target}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {match.status === 'completed'
                            ? (match.result?.winner === battingTeam?.id 
                                ? 'Target Reached ✅' 
                                : (match.result?.winner ? 'Target Missed ❌' : 'Match Tied 🤝'))
                            : `Need ${needed} in ${(match.totalOvers * 6) - (innings?.balls || 0)} balls`
                          }
                        </div>
                      </div>
                    )}

                    {/* 1st innings score if in 2nd */}
                    {inningsIdx === 1 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {teams.find(t => t.id === match.innings[0].teamId)?.name}
                        </div>
                        <div style={{ fontFamily: 'Oswald', fontSize: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {match.innings[0].runs}/{match.innings[0].wickets}
                          <span style={{ fontSize: 14, marginLeft: 6 }}>({formatOvers(match.innings[0].balls)})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Win Predictor */}
                  {match.status === 'live' && inningsIdx === 1 && target && (() => {
                    const ballsRemaining = (match.totalOvers * 6) - (innings?.balls || 0);
                    const wicketsRemaining = Math.max(0, 10 - (innings?.wickets || 0));
                    const crr = (innings?.runs || 0) / (Math.max(1, innings?.balls) / 6);
                    const rrr = needed / (Math.max(1, ballsRemaining) / 6);
                    
                    let winProb = 50;
                    if (innings?.balls > 0) {
                      // Adjust based on CRR vs RRR
                      const rrDiff = crr - rrr;
                      winProb += rrDiff * 6; 
                      
                      // Adjust based on wickets
                      if (wicketsRemaining <= 2) winProb -= 35;
                      else if (wicketsRemaining <= 4) winProb -= 15;
                      else if (wicketsRemaining >= 8) winProb += 15;
                      
                      // Late game adjustments
                      if (ballsRemaining <= 12) {
                        if (needed > wicketsRemaining * 8) winProb -= 20;
                        if (needed <= ballsRemaining) winProb += 20;
                      }
                      
                      winProb = Math.max(1, Math.min(99, winProb));
                    }
                    
                    const team1Color = battingTeam?.color || 'var(--green-primary)';
                    const team2Color = teams.find(t => t.id === match.innings[0].teamId)?.color || 'var(--bg-secondary)';
                    
                    return (
                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                          <span style={{ color: team1Color }}>{battingTeam?.shortName || battingTeam?.name} ({Math.round(winProb)}%)</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Win Predictor</span>
                          <span style={{ color: team2Color }}>{teams.find(t => t.id === match.innings[0].teamId)?.shortName || teams.find(t => t.id === match.innings[0].teamId)?.name} ({Math.round(100 - winProb)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: team2Color, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${winProb}%`, height: '100%', background: team1Color, transition: 'width 1s ease' }}></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Current Batsmen & Partnership */}
                  {match.status === 'live' && striker && (
                    <>
                      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[striker, nonStriker].filter(Boolean).map(batter => (
                          <div key={batter.id} style={{
                            flex: 1, minWidth: 140,
                            background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 14px',
                            border: batter.isStriker ? '1px solid var(--green-primary)' : '1px solid transparent',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {batter.name} {batter.isStriker && '⚡'}
                              </div>
                            </div>
                            <div style={{ fontFamily: 'Oswald', fontSize: 22, fontWeight: 700 }}>
                              {batter.runs}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>({batter.balls})</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              SR: {batter.strikeRate} • 4s: {batter.fours} • 6s: {batter.sixes}
                            </div>
                          </div>
                        ))}
                        {currentBowler && (
                          <div style={{
                            flex: 1, minWidth: 140,
                            background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}>
                            <div style={{ fontSize: 12, color: 'var(--red-light)', fontWeight: 600, marginBottom: 4 }}>
                              ⚾ {currentBowler.name}
                            </div>
                            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700 }}>
                              {currentBowler.wickets}-{currentBowler.runs}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {currentBowler.overs} overs • Eco: {currentBowler.economy}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Partnership & Over Timeline */}
                      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Partnership</span>
                          <span style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 700, color: 'var(--gold-light)' }}>
                            {innings.currentPartnership?.runs || 0}
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>({innings.currentPartnership?.balls || 0})</span>
                          </span>
                        </div>
                        {groupedOvers.length > 0 && (
                          <div style={{ flex: 2, minWidth: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>This Over</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {groupedOvers[groupedOvers.length - 1].map((b, i) => (
                                <span key={i} style={{ 
                                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, fontWeight: 700, fontFamily: 'Oswald',
                                  background: b.display === 'W' ? 'var(--red-primary)' : ['4','6'].includes(b.display) ? 'var(--green-primary)' : 'rgba(255,255,255,0.1)',
                                  color: b.display === 'W' || ['4','6'].includes(b.display) ? '#fff' : 'var(--text-secondary)'
                                }}>{b.display}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Upcoming match display */}
              {match.status === 'upcoming' && (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
                  <div style={{ fontFamily: 'Oswald', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
                    {team1?.name} <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>vs</span> {team2?.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                    {match.format} • {match.totalOvers} overs • {match.venue || 'Venue TBD'} • {match.date || 'Date TBD'}
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={() => setShowToss(true)}>
                    ▶ Start Match — Toss
                  </button>
                </div>
              )}

              {/* Scoring Pad - only for live */}
              {match.status === 'live' && innings?.batting?.length > 0 && (() => {
                const ballsInOver = (innings?.balls || 0) % 6;
                const overNum = Math.floor((innings?.balls || 0) / 6);

                if (overComplete) {
                  // Over complete banner — must select new bowler
                  return (
                    <div className="card" style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
                      border: '1px solid rgba(245,158,11,0.35)',
                      textAlign: 'center', padding: '28px 20px',
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
                      <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700, color: 'var(--gold-light)', marginBottom: 6 }}>
                        Over {overNum} Complete!
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Select the bowler for Over {overNum + 1} to continue scoring
                      </div>
                      <button
                        className="btn btn-gold btn-lg"
                        onClick={() => setShowChangeBowler(true)}
                        style={{ margin: '0 auto' }}
                      >
                        ⚾ Select Next Bowler
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="card">
                    <div className="section-header">
                      <h2 className="section-title">🎯 Score Delivery</h2>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Over {Math.floor((innings?.balls || 0) / 6) + 1}, Ball {((innings?.balls || 0) % 6) + 1} of 6
                      </div>
                    </div>
                    <div className="score-pad">
                      {[0, 1, 2, 3, 4, 6].map(r => (
                        <button key={r} className={`score-btn score-btn-${r}`} onClick={() => handleDelivery('normal', r)}>
                          {r}
                          {r === 4 && <span className="btn-sub">FOUR</span>}
                          {r === 6 && <span className="btn-sub">SIX</span>}
                        </button>
                      ))}
                      <button className="score-btn score-btn-w" onClick={() => handleDelivery('wicket', 0)}>
                        W<span className="btn-sub">WICKET</span>
                      </button>
                      <button className="score-btn score-btn-wd" onClick={() => handleDelivery('wide', 0)}>
                        WD<span className="btn-sub">WIDE</span>
                      </button>
                      <button className="score-btn score-btn-nb" onClick={() => handleDelivery('noball', 0)}>
                        NB<span className="btn-sub">NO BALL</span>
                      </button>
                      <button className="score-btn score-btn-lb" onClick={() => handleDelivery('legbye', 1)}>
                        LB<span className="btn-sub">LEG BYE</span>
                      </button>
                      <button className="score-btn score-btn-bye" onClick={() => handleDelivery('bye', 1)}>
                        BYE<span className="btn-sub">BYE</span>
                      </button>
                    </div>

                    {/* Extras with runs */}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      {['wide', 'noball', 'bye', 'legbye'].map(type => (
                        <div key={type} style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>
                            {type.toUpperCase()} +runs
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[1, 2, 3, 4].map(r => (
                              <button
                                key={r}
                                onClick={() => handleDelivery(type, r)}
                                style={{
                                  flex: 1, padding: '4px 2px', fontSize: 11, borderRadius: 6,
                                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
                                }}
                              >{type[0].toUpperCase()}+{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}


              {/* Last Over Ball History */}
              {innings?.ballHistory?.length > 0 && (
                <div className="card">
                  <div className="section-header">
                    <h2 className="section-title">🎾 This Over</h2>
                    <div style={{ fontSize: 13, color: 'var(--green-primary)', fontWeight: 600 }}>
                      Over {Math.floor((innings?.balls || 0) / 6) + 1}
                    </div>
                  </div>
                  <div className="ball-history">
                    {(groupedOvers[groupedOvers.length - 1] || []).map((ball, i) => (
                      <div
                        key={i}
                        className={`ball-dot ball-${ball.type === 'wicket' ? 'W' : ball.type === 'wide' ? 'WD' : ball.type === 'noball' ? 'NB' : ball.type === 'legbye' ? 'LB' : ball.type === 'bye' ? 'B' : ball.runs || 0}`}
                      >
                        {ball.display}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- SCORECARD DETAILS TAB ---- */}
          {tab === 'scorecard_details' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {[0, 1].map(idx => {
                  const inn = match.innings[idx];
                  if (!inn) return null;
                  const t = teams.find(team => team.id === inn.teamId);
                  return (
                    <button 
                      key={idx} 
                      style={{ 
                        flex: 1, padding: '16px', background: scorecardInnings === idx ? 'var(--bg-card)' : 'rgba(255,255,255,0.02)', 
                        border: 'none', borderBottom: scorecardInnings === idx ? '2px solid var(--gold-light)' : '2px solid transparent',
                        color: scorecardInnings === idx ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: scorecardInnings === idx ? 700 : 500, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onClick={() => setScorecardInnings(idx)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div>{t?.name}</div>
                        {(inn.batting.length > 0 || inn.balls > 0) && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{idx === 0 ? '1st Inn' : '2nd Inn'}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '0 24px 24px' }}>
                {(() => {
                  const inn = match.innings[scorecardInnings];
                  const battTeam = inn ? teams.find(t => t.id === inn.teamId) : null;
                  
                  if (!inn || inn.batting.length === 0) {
                    return (
                      <div style={{ padding: '24px 0' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16, marginBottom: 16 }}>
                          {battTeam?.name} Line-up
                        </div>
                        {(!battTeam?.players || battTeam.players.length === 0) ? (
                          <div style={{ color: 'var(--text-muted)' }}>No players in lineup</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {battTeam.players.map(p => (
                              <div key={p.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                  👤
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {p.name} {p.isCaptain && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>(C)</span>} {p.isWK && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>(Wk)</span>}
                                  </div>
                                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {[p.battingStyle && `${p.battingStyle} Batsman`, p.bowlingStyle && `${p.bowlingStyle} Bowler`].filter(Boolean).join(' • ') || p.role || 'Player'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  const bowlTeamId = inn.teamId === match.team1Id ? match.team2Id : match.team1Id;
                  const bowlTeam = team1?.id === bowlTeamId ? team1 : team2;
                  
                  const totalExtras = (inn.extras?.wides||0) + (inn.extras?.noballs||0) + (inn.extras?.byes||0) + (inn.extras?.legbyes||0);
                  const yetToBat = battTeam?.players?.filter(p => !inn.batting.find(b => b.id === p.id)) || [];

                  const getDismissalText = (b) => {
                    if (!b.isOut) return b.balls > 0 ? 'not out' : 'did not bat';
                    const bowler = bowlTeam?.players?.find(p => p.id === b.dismissedBy)?.name || 'Bowler';
                    const fielder = bowlTeam?.players?.find(p => p.id === b.fielderId)?.name || 'Fielder';
                    switch (b.dismissal) {
                      case 'bowled': return `b ${bowler}`;
                      case 'caught': return `c ${fielder} b ${bowler}`;
                      case 'lbw': return `lbw b ${bowler}`;
                      case 'runout': return `run out (${fielder})`;
                      case 'stumped': return `st ${fielder} b ${bowler}`;
                      case 'hitwicket': return `hit wicket b ${bowler}`;
                      case 'handledball': return `handled ball`;
                      case 'obstructingfield': return `obstructing the field`;
                      default: return b.dismissal || 'out';
                    }
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* Batting Section */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Batting</span>
                          <div style={{ display: 'flex', gap: 16, width: 200, justifyContent: 'flex-end' }}>
                            <span style={{ width: 30, textAlign: 'center' }}>R</span>
                            <span style={{ width: 30, textAlign: 'center' }}>B</span>
                            <span style={{ width: 30, textAlign: 'center' }}>4s</span>
                            <span style={{ width: 30, textAlign: 'center' }}>6s</span>
                            <span style={{ width: 44, textAlign: 'center' }}>S/R</span>
                          </div>
                        </div>

                        {inn.batting.map(b => (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', background: b.isStriker ? 'rgba(16,185,129,0.05)' : 'transparent', margin: b.isStriker ? '0 -24px' : 0, paddingLeft: b.isStriker ? 24 : 0, paddingRight: b.isStriker ? 24 : 0 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                👤
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {b.name}
                                  {b.isStriker && <span style={{ color: 'var(--green-primary)', fontSize: 12 }}>←</span>}
                                  {b.isNonStriker && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>*</span>}
                                  {match.substitutions?.some(s => s.playerInId === b.id) && <span style={{ fontSize: 10, background: 'var(--gold-light)', color: '#000', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>IMPACT</span>}
                                  {match.substitutions?.some(s => s.playerOutId === b.id) && <span style={{ fontSize: 10, background: 'var(--bg-card)', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>OUT</span>}
                                </div>
                                <div style={{ fontSize: 13, color: b.isOut ? 'var(--text-muted)' : 'var(--green-primary)', marginTop: 4 }}>
                                  {getDismissalText(b)}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: 200, justifyContent: 'flex-end', fontFamily: 'Oswald', fontSize: 15 }}>
                              <span style={{ width: 30, textAlign: 'center', fontWeight: 700, color: b.runs >= 50 ? 'var(--gold-light)' : 'var(--text-primary)' }}>{b.runs}</span>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{b.balls}</span>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{b.fours}</span>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{b.sixes}</span>
                              <span style={{ width: 44, textAlign: 'center', color: 'var(--text-muted)' }}>{b.strikeRate || '—'}</span>
                            </div>
                          </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontWeight: 600 }}>Extras</div>
                          <div style={{ fontWeight: 600 }}>{totalExtras} <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>(W {inn.extras?.wides || 0}, NB {inn.extras?.noballs || 0}, B {inn.extras?.byes || 0}, LB {inn.extras?.legbyes || 0})</span></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>Total runs</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{inn.runs} <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>({inn.wickets} wkts, {formatOvers(inn.balls)} ov)</span></div>
                        </div>

                        {yetToBat.length > 0 && (
                          <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>Yet to bat</div>
                            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                              {yetToBat.map(p => p.name).join(' • ')}
                            </div>
                          </div>
                        )}

                        {inn.fow && inn.fow.length > 0 && (
                          <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>Fall of wickets</div>
                            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {inn.fow.map(w => <span key={w.wickets} style={{ marginRight: 12, display: 'inline-block' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{w.runs}/{w.wickets}</strong> <span style={{ color: 'var(--text-muted)' }}>({w.batsmanId ? battTeam?.players?.find(p => p.id === w.batsmanId)?.name || 'Batter' : 'Batter'}, {w.over} ov)</span>
                              </span>)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bowling Section */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Bowling</span>
                          <div style={{ display: 'flex', gap: 16, width: 220, justifyContent: 'flex-end' }}>
                            <span style={{ width: 30, textAlign: 'center' }}>O</span>
                            <span style={{ width: 30, textAlign: 'center' }}>M</span>
                            <span style={{ width: 30, textAlign: 'center' }}>R</span>
                            <span style={{ width: 30, textAlign: 'center' }}>W</span>
                            <span style={{ width: 44, textAlign: 'center' }}>Econ</span>
                          </div>
                        </div>

                        {inn.bowling.map(b => (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {b.name}
                              {match.substitutions?.some(s => s.playerInId === b.id) && <span style={{ fontSize: 10, background: 'var(--gold-light)', color: '#000', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>IMPACT</span>}
                              {match.substitutions?.some(s => s.playerOutId === b.id) && <span style={{ fontSize: 10, background: 'var(--bg-card)', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>OUT</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: 220, justifyContent: 'flex-end', fontFamily: 'Oswald', fontSize: 15 }}>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>{b.overs}</span>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{b.maidens || 0}</span>
                              <span style={{ width: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>{b.runs || 0}</span>
                              <span style={{ width: 30, textAlign: 'center', fontWeight: 700, color: b.wickets > 0 ? 'var(--green-primary)' : 'var(--text-primary)' }}>{b.wickets || 0}</span>
                              <span style={{ width: 44, textAlign: 'center', color: 'var(--text-muted)' }}>{b.economy || '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ---- COMMENTARY TAB ---- */}
          {tab === 'commentary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 0].map(idx => {
                const inn = match.innings[idx];
                if (!inn || inn.balls === 0) return null;
                const battTeam = teams.find(t => t.id === inn.teamId);
                
                return (
                  <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 16 }}>{battTeam?.name} Innings</span>
                    </div>
                    
                    <div style={{ padding: 0 }}>
                      {inn.ballHistory && inn.ballHistory.slice().reverse().map((ball, j) => {
                        const isWicket = ball.type === 'wicket';
                        const isBoundary = ball.runs >= 4 && !isWicket;
                        
                        return (
                          <div key={j} style={{ 
                            display: 'flex', gap: 16, padding: '16px 20px', 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: isWicket ? 'rgba(239,68,68,0.05)' : isBoundary ? 'rgba(16,185,129,0.05)' : 'transparent'
                          }}>
                            {/* Over / Ball indicator */}
                            <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
                              <div style={{ fontFamily: 'Oswald', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{ball.over}</div>
                            </div>
                            
                            {/* Event display circle */}
                            <div style={{ flexShrink: 0 }}>
                              <div className={`ball-dot ball-${isWicket ? 'W' : ball.type === 'wide' ? 'WD' : ball.type === 'noball' ? 'NB' : ball.type === 'legbye' ? 'LB' : ball.type === 'bye' ? 'B' : ball.runs || 0}`} 
                                   style={{ width: 36, height: 36, fontSize: 14 }}>
                                {ball.display}
                              </div>
                            </div>
                            
                            {/* Commentary Text */}
                            <div style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>
                              <div style={{ color: 'var(--text-primary)' }}>
                                {ball.commentary ? (
                                  <>
                                    <span style={{ fontWeight: 600 }}>{ball.commentary.split(',')[0]}</span>, 
                                    <span style={{ color: isWicket ? 'var(--red-light)' : isBoundary ? 'var(--green-light)' : 'var(--text-secondary)' }}>
                                      {ball.commentary.substring(ball.commentary.indexOf(',') + 1)}
                                    </span>
                                  </>
                                ) : (
                                  `${ball.display} runs scored`
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {match.innings[0].balls === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No commentary available yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- MODALS ---- */}
        {/* Toss Modal */}
        <TossModal
          open={showToss}
          onClose={() => setShowToss(false)}
          match={match}
          team1={team1}
          team2={team2}
          onStart={handleTossSetup}
        />

        {/* Wicket Modal */}
        <WicketModal
          open={showWicketModal}
          onClose={() => { setShowWicketModal(false); setPendingDelivery(null); }}
          onConfirm={handleWicket}
          fielders={teams.find(t => t.id === bowlingTeamId)?.players || []}
        />

        {/* New Batsman Modal */}
        <NewBatsmanModal
          open={showNewBatsman}
          onClose={() => setShowNewBatsman(false)}
          onSelect={handleNewBatsman}
          team={battingTeam}
          alreadyIn={innings?.batting || []}
        />

        {/* Change Bowler Modal */}
        <NewBatsmanModal
          open={showChangeBowler}
          onClose={() => setShowChangeBowler(false)}
          onSelect={handleNewBowler}
          team={bowlingTeam}
          alreadyIn={lastBowlerId ? [{ id: lastBowlerId, isOut: true }] : []}
          title="Select Bowler"
          isBowler={true}
        />

        {/* Second innings lineup modal */}
        <LineupModal
          open={showLineup}
          onClose={() => setShowLineup(false)}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          onSave={(batting, bowling) => {
            setInningsLineup(id, inningsIdx, batting, bowling);
            setShowLineup(false);
          }}
        />

        {/* Rain Delay Modal */}
        <RainDelayModal
          open={showRainDelay}
          onClose={() => setShowRainDelay(false)}
          match={match}
          inningsIdx={inningsIdx}
          onSave={(newTotalOvers, newTarget) => {
            updateMatch(match.id, {
              totalOvers: newTotalOvers,
              target: newTarget || match.target,
            });
            setShowRainDelay(false);
          }}
        />

        {/* Impact Player Modal */}
        <ImpactPlayerModal
          open={showImpactModal}
          onClose={() => setShowImpactModal(false)}
          match={match}
          team1Raw={team1Raw}
          team2Raw={team2Raw}
          onConfirm={(teamId, pOut, pIn) => {
            applySubstitution(id, teamId, pOut, pIn);
            setShowImpactModal(false);
            show('Impact Player substituted successfully!', 'success');
          }}
        />

        <Toast toast={toast} />
      </main>
    </div>
  );
}

function TossModal({ open, onClose, match, team1, team2, onStart }) {
  const [tossWinner, setTossWinner] = useState('');
  const [tossChoice, setTossChoice] = useState('bat');
  const [playingXI, setPlayingXI] = useState({});
  const [battingOrder, setBattingOrder] = useState([]);
  const [bowlingOrder, setBowlingOrder] = useState([]);
  const [step, setStep] = useState(1);
  const [xiTab, setXiTab] = useState(team1?.id); // for playing XI selection tabs

  useEffect(() => {
    if (open && team1 && team2) {
      setPlayingXI({
        [team1.id]: team1.players.length <= 11 ? team1.players.map(p => p.id) : [],
        [team2.id]: team2.players.length <= 11 ? team2.players.map(p => p.id) : [],
      });
      setBattingOrder([]);
      setBowlingOrder([]);
      setStep(1);
      setXiTab(team1.id);
    }
  }, [open, team1, team2]);

  if (!open) return null;

  const handleNextToPlayingXI = () => {
    if (!tossWinner) return alert('Select toss winner');
    // If both teams have <= 11 players, we can skip Step 2 and go to Step 3
    if (team1?.players.length <= 11 && team2?.players.length <= 11) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleTogglePlayer = (teamId, playerId) => {
    setPlayingXI(prev => {
      const teamXI = prev[teamId] || [];
      if (teamXI.includes(playerId)) {
        return { ...prev, [teamId]: teamXI.filter(id => id !== playerId) };
      } else {
        if (teamXI.length >= 11) {
          alert('You can only select 11 players.');
          return prev;
        }
        return { ...prev, [teamId]: [...teamXI, playerId] };
      }
    });
  };

  const handleNextToLineup = () => {
    if (playingXI[team1.id].length < 2) return alert(`Please select at least 2 players for ${team1.name}`);
    if (playingXI[team2.id].length < 2) return alert(`Please select at least 2 players for ${team2.name}`);
    setStep(3);
  };

  const handleStart = () => {
    if (battingOrder.length < 2) return alert('Please select at least 2 opening batsmen (Striker & Non-Striker)');
    if (bowlingOrder.length < 1) return alert('Please select 1 opening bowler');
    onStart(tossWinner, tossChoice, { batting: battingOrder, bowling: bowlingOrder }, playingXI);
  };

  const battingTeamFull = tossChoice === 'bat' ? (tossWinner === match.team1Id ? team1 : team2) : (tossWinner === match.team1Id ? team2 : team1);
  const bowlingTeamFull = battingTeamFull?.id === team1?.id ? team2 : team1;
  
  const battingTeamActive = { ...battingTeamFull, players: battingTeamFull?.players?.filter(p => playingXI[battingTeamFull.id]?.includes(p.id)) || [] };
  const bowlingTeamActive = { ...bowlingTeamFull, players: bowlingTeamFull?.players?.filter(p => playingXI[bowlingTeamFull.id]?.includes(p.id)) || [] };

  return (
    <Modal open={open} onClose={onClose} title={step === 1 ? "⚖️ Toss" : step === 2 ? "👥 Playing XI" : "📋 Opening Lineup"} size="lg"
      footer={
        step === 1
          ? <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleNextToPlayingXI}>Next →</button></>
          : step === 2
          ? <><button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button><button className="btn btn-primary" onClick={handleNextToLineup}>Next →</button></>
          : <><button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button><button className="btn btn-gold" onClick={handleStart}>🏏 Start Match</button></>
      }
    >
      {step === 1 ? (
        <>
          <div className="form-group">
            <label className="form-label">Toss Winner</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[team1, team2].map(t => t && (
                <div
                  key={t.id}
                  onClick={() => setTossWinner(t.id)}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${tossWinner === t.id ? t.color || 'var(--green-primary)' : 'var(--border)'}`,
                    background: tossWinner === t.id ? `${t.color || '#10b981'}22` : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `linear-gradient(135deg, ${t.color || '#10b981'}, ${t.color ? t.color + '88' : '#059669'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Oswald', fontSize: 14, fontWeight: 700,
                  }}>{(t.shortName || t.name)[0]}</div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  {tossWinner === t.id && <span style={{ marginLeft: 'auto', color: 'var(--green-primary)' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Toss Winner Elects To</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['bat', 'bowl'].map(choice => (
                <div
                  key={choice}
                  onClick={() => setTossChoice(choice)}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${tossChoice === choice ? 'var(--green-primary)' : 'var(--border)'}`,
                    background: tossChoice === choice ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                    textAlign: 'center', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{choice === 'bat' ? '🏏' : '⚾'}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{choice}</div>
                </div>
              ))}
            </div>
          </div>
          {tossWinner && (
            <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--border-accent)', borderRadius: 10, fontSize: 14, color: 'var(--green-primary)', fontWeight: 600 }}>
              {(tossWinner === team1?.id ? team1 : team2)?.name} won the toss and elected to {tossChoice} first.
              <br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                {battingTeamFull?.name} will bat • {bowlingTeamFull?.name} will bowl
              </span>
            </div>
          )}
        </>
      ) : step === 2 ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[team1, team2].map(t => (
              <button 
                key={t.id} 
                onClick={() => setXiTab(t.id)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 8, 
                  background: xiTab === t.id ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${xiTab === t.id ? 'var(--gold-light)' : 'var(--border)'}`,
                  color: xiTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: xiTab === t.id ? 700 : 500, cursor: 'pointer'
                }}
              >
                {t.shortName || t.name} ({playingXI[t.id]?.length || 0}/11)
              </button>
            ))}
          </div>
          
          <div className="form-group" style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300 }}>
              {(xiTab === team1.id ? team1 : team2)?.players?.map(p => {
                const isSelected = playingXI[xiTab]?.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="player-item"
                    onClick={() => handleTogglePlayer(xiTab, p.id)}
                    style={{
                      background: isSelected ? 'rgba(245,158,11,0.08)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--gold-light)' : 'transparent'}`,
                      borderRadius: 8, cursor: 'pointer'
                    }}
                  >
                    <div className="player-avatar" style={{ background: isSelected ? 'rgba(245,158,11,0.2)' : 'var(--bg-card-hover)', color: isSelected ? 'var(--gold-light)' : 'var(--text-secondary)' }}>
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role}</div>
                    </div>
                    {isSelected && <span style={{ color: 'var(--gold-light)', fontSize: 16 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">🏏 Select Opening Batsmen — {battingTeamActive?.name}</label>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Click to select: 1st click = Striker, 2nd click = Non-Striker
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {battingTeamActive?.players?.map(p => {
                const inOrder = battingOrder.find(b => b.id === p.id);
                const pos = battingOrder.findIndex(b => b.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="player-item"
                    onClick={() => {
                      if (inOrder) setBattingOrder(o => o.filter(b => b.id !== p.id));
                      else if (battingOrder.length < 2) setBattingOrder(o => [...o, p]);
                    }}
                    style={{
                      background: inOrder ? 'rgba(16,185,129,0.08)' : 'transparent',
                      border: `1px solid ${inOrder ? 'var(--border-accent)' : 'transparent'}`,
                      borderRadius: 8,
                    }}
                  >
                    <div className="player-avatar" style={{ background: inOrder ? 'rgba(16,185,129,0.2)' : 'var(--bg-card-hover)', color: inOrder ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
                      {inOrder ? pos + 1 : (p.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role} {p.battingStyle && `• ${p.battingStyle}`}</div>
                    </div>
                    {inOrder && (
                      <span style={{ color: 'var(--green-primary)', fontSize: 12, fontWeight: 700 }}>
                        {pos === 0 ? '✓ Striker' : pos === 1 ? '✓ Non-Striker' : `#${pos + 1}`}
                      </span>
                    )}
                  </div>
                );
              })}
              {(!battingTeamActive?.players?.length) && (
                <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                  No players in this team. <Link href="/teams" style={{ color: 'var(--green-primary)' }}>Add players →</Link>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">⚾ Select Opening Bowler — {bowlingTeamActive?.name}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
              {bowlingTeamActive?.players?.filter(p => p.role === 'Bowler' || p.role === 'All-rounder').map(p => {
                const selected = bowlingOrder.find(b => b.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="player-item"
                    onClick={() => {
                      if (selected) setBowlingOrder([]);
                      else setBowlingOrder([p]); // Only allow 1 bowler to be selected
                    }}
                    style={{
                      background: selected ? 'rgba(239,68,68,0.06)' : 'transparent',
                      border: `1px solid ${selected ? 'rgba(239,68,68,0.2)' : 'transparent'}`,
                      borderRadius: 8,
                    }}
                  >
                    <div className="player-avatar" style={{ background: selected ? 'rgba(239,68,68,0.15)' : 'var(--bg-card-hover)', color: selected ? 'var(--red-light)' : 'var(--text-secondary)' }}>
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.bowlingStyle || p.role}</div>
                    </div>
                    {selected && <span style={{ color: 'var(--red-light)', fontSize: 12 }}>✓ Bowling</span>}
                  </div>
                );
              })}
              {(!bowlingTeamActive?.players?.length) && (
                <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>No players in bowling team.</div>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function WicketModal({ open, onClose, onConfirm, fielders }) {
  const [dismissal, setDismissal] = useState('Bowled');
  const [fielder, setFielder] = useState('');

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="🎉 Wicket!" size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => onConfirm(dismissal, fielder)}>Confirm Wicket</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Dismissal Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DISMISSAL_TYPES.map(d => (
            <button
              key={d}
              onClick={() => setDismissal(d)}
              className={`btn btn-sm ${dismissal === d ? 'btn-danger' : 'btn-secondary'}`}
            >{d}</button>
          ))}
        </div>
      </div>
      {['Caught', 'Run Out', 'Stumped'].includes(dismissal) && (
        <div className="form-group">
          <label className="form-label">Fielder</label>
          <select className="form-select" value={fielder} onChange={e => setFielder(e.target.value)}>
            <option value="">Select fielder...</option>
            {fielders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}
    </Modal>
  );
}

function NewBatsmanModal({ open, onClose, onSelect, team, alreadyIn, title = "Select New Batsman", isBowler = false }) {
  if (!open) return null;
  const available = (team?.players || []).filter(p => {
    if (alreadyIn.find(b => b.id === p.id)) return false;
    if (isBowler && p.role !== 'Bowler' && p.role !== 'All-rounder') return false;
    return true;
  });

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {available.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            {alreadyIn.length === 0 ? 'No players in this team' : 'All players have batted'}
          </div>
        ) : available.map(p => (
          <div key={p.id} className="player-item" onClick={() => { onSelect(p); onClose(); }}
            style={{ cursor: 'pointer', borderRadius: 8, border: '1px solid transparent' }}
          >
            <div className="player-avatar">{(p.name || '?')[0].toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function LineupModal({ open, onClose, battingTeam, bowlingTeam, onSave }) {
  const [battingOrder, setBattingOrder] = useState([]);
  const [bowlingOrder, setBowlingOrder] = useState([]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setBattingOrder([]);
      setBowlingOrder([]);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (battingOrder.length < 2) return alert('Please select at least 2 opening batsmen (Striker & Non-Striker)');
    if (bowlingOrder.length < 1) return alert('Please select 1 opening bowler');
    onSave(battingOrder, bowlingOrder);
  };

  return (
    <Modal open={open} onClose={onClose} title="Set 2nd Innings Lineup" size="lg"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={handleSave}>🏏 Start 2nd Innings</button></>}
    >
      <div className="form-group">
        <label className="form-label">🏏 Select Opening Batsmen — {battingTeam?.name}</label>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Click to select: 1st click = Striker, 2nd click = Non-Striker
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {battingTeam?.players?.map(p => {
            const inOrder = battingOrder.find(b => b.id === p.id);
            const pos = battingOrder.findIndex(b => b.id === p.id);
            return (
              <div
                key={p.id}
                className="player-item"
                onClick={() => {
                  if (inOrder) setBattingOrder(o => o.filter(b => b.id !== p.id));
                  else if (battingOrder.length < 2) setBattingOrder(o => [...o, p]);
                }}
                style={{
                  background: inOrder ? 'rgba(16,185,129,0.08)' : 'transparent',
                  border: `1px solid ${inOrder ? 'var(--border-accent)' : 'transparent'}`,
                  borderRadius: 8,
                }}
              >
                <div className="player-avatar" style={{ background: inOrder ? 'rgba(16,185,129,0.2)' : 'var(--bg-card-hover)', color: inOrder ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
                  {inOrder ? pos + 1 : (p.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role} {p.battingStyle && `• ${p.battingStyle}`}</div>
                </div>
                {inOrder && (
                  <span style={{ color: 'var(--green-primary)', fontSize: 12, fontWeight: 700 }}>
                    {pos === 0 ? '✓ Striker' : pos === 1 ? '✓ Non-Striker' : `#${pos + 1}`}
                  </span>
                )}
              </div>
            );
          })}
          {(!battingTeam?.players?.length) && (
            <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>No players in this team.</div>
          )}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">⚾ Select Opening Bowler — {bowlingTeam?.name}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
          {bowlingTeam?.players?.filter(p => p.role === 'Bowler' || p.role === 'All-rounder').map(p => {
            const selected = bowlingOrder.find(b => b.id === p.id);
            return (
              <div
                key={p.id}
                className="player-item"
                onClick={() => {
                  if (selected) setBowlingOrder([]);
                  else setBowlingOrder([p]); // Only allow 1 bowler
                }}
                style={{
                  background: selected ? 'rgba(239,68,68,0.06)' : 'transparent',
                  border: `1px solid ${selected ? 'rgba(239,68,68,0.2)' : 'transparent'}`,
                  borderRadius: 8,
                }}
              >
                <div className="player-avatar" style={{ background: selected ? 'rgba(239,68,68,0.15)' : 'var(--bg-card-hover)', color: selected ? 'var(--red-light)' : 'var(--text-secondary)' }}>
                  {(p.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.bowlingStyle || p.role}</div>
                </div>
                {selected && <span style={{ color: 'var(--red-light)', fontSize: 12 }}>✓ Bowling</span>}
              </div>
            );
          })}
          {(!bowlingTeam?.players?.length) && (
            <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>No players in bowling team.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function RainDelayModal({ open, onClose, match, inningsIdx, onSave }) {
  const [oversLost, setOversLost] = useState(0);

  if (!open) return null;

  const currentOvers = match.totalOvers;
  const newOvers = Math.max(1, currentOvers - oversLost);
  
  let newTarget = null;
  if (inningsIdx === 1) {
    // 2nd innings rain delay: recalculate target using proportionate run rate method (simplified DLS)
    const inn1Runs = match.innings[0].runs;
    const inn1Overs = currentOvers; // Assuming they played full quota or were bowled out
    const proportionateRunRate = inn1Runs / inn1Overs;
    newTarget = Math.floor(proportionateRunRate * newOvers) + 1;
  }

  return (
    <Modal open={open} onClose={onClose} title="🌧️ Rain Delay / DLS Target Revision"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(newOvers, newTarget)}>Apply Revised Target</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Overs Lost due to Rain</label>
        <input 
          type="number" 
          className="form-control" 
          value={oversLost} 
          onChange={(e) => setOversLost(parseInt(e.target.value) || 0)} 
          min="0" 
          max={currentOvers - 1} 
        />
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Match will be reduced from {currentOvers} to {newOvers} overs.
        </div>
      </div>

      {inningsIdx === 1 && newTarget !== null && (
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Revised Target (Proportionate Method):</div>
          <div style={{ fontFamily: 'Oswald', fontSize: 24, fontWeight: 700, color: 'var(--gold-light)' }}>
            {newTarget}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Original target was {match.target} in {currentOvers} overs.
          </div>
        </div>
      )}
      
      {inningsIdx === 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Note:</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Since the 1st innings is still ongoing, the target will be calculated automatically at the end of the innings based on the new total of {newOvers} overs.
          </div>
        </div>
      )}
    </Modal>
  );
}

function ImpactPlayerModal({ open, onClose, match, team1Raw, team2Raw, onConfirm }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedTeamId('');
      setPlayerOutId('');
      setPlayerInId('');
    }
  }, [open]);

  if (!open) return null;

  const usedSubs = match.substitutions || [];
  const team1Used = usedSubs.some(s => s.teamId === team1Raw?.id);
  const team2Used = usedSubs.some(s => s.teamId === team2Raw?.id);

  const availableTeams = [
    ...(!team1Used && team1Raw ? [team1Raw] : []),
    ...(!team2Used && team2Raw ? [team2Raw] : [])
  ];

  const selectedTeam = availableTeams.find(t => t.id === selectedTeamId);
  const currentXI = selectedTeam ? match.playingXI?.[selectedTeam.id] || [] : [];
  
  const playersOut = selectedTeam?.players?.filter(p => currentXI.includes(p.id)) || [];
  const playersIn = selectedTeam?.players?.filter(p => !currentXI.includes(p.id)) || [];

  const handleConfirm = () => {
    if (!selectedTeamId || !playerOutId || !playerInId) return alert('Please select all fields');
    onConfirm(selectedTeamId, playerOutId, playerInId);
  };
  
  return (
    <Modal open={open} onClose={onClose} title="🔁 Impact Player Substitution" size="sm" footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={!playerInId || !playerOutId}>Apply Swap</button>
      </>
    }>
      {availableTeams.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
          Both teams have already used their Impact Player substitution.
        </div>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">Select Team</label>
            <select className="form-select" value={selectedTeamId} onChange={e => { setSelectedTeamId(e.target.value); setPlayerOutId(''); setPlayerInId(''); }}>
              <option value="">-- Choose Team --</option>
              {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {selectedTeam && (
            <>
              <div className="form-group">
                <label className="form-label">Player OUT (Currently in XI)</label>
                <select className="form-select" value={playerOutId} onChange={e => setPlayerOutId(e.target.value)}>
                  <option value="">-- Select Player to come off --</option>
                  {playersOut.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Player IN (From Bench)</label>
                <select className="form-select" value={playerInId} onChange={e => setPlayerInId(e.target.value)}>
                  <option value="">-- Select Impact Player --</option>
                  {playersIn.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
