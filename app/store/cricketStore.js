'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CricketContext = createContext(null);

const STORAGE_KEY = 'cricket_scorecard_data';

const cskPlayers = [
  { id: 'csk-1', name: 'Ruturaj Gaikwad', role: 'Batter', isCaptain: true, battingStyle: 'Right-hand' },
  { id: 'csk-2', name: 'Sanju Samson', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'csk-3', name: 'Dewald Brevis', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'csk-4', name: 'Shivam Dube', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'csk-5', name: 'Prashant Veer', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'csk-6', name: 'MS Dhoni', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'csk-7', name: 'Kartik Sharma', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'csk-8', name: 'Rahul Chahar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' },
  { id: 'csk-9', name: 'Noor Ahmad', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Slow left-arm chinaman' },
  { id: 'csk-10', name: 'Khaleel Ahmed', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm fast-medium' },
  { id: 'csk-11', name: 'Ravindra Jadeja', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'csk-12', name: 'Sarfaraz Khan', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'csk-13', name: 'Urvil Patel', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'csk-14', name: 'Ayush Mhatre', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'csk-15', name: 'Jamie Overton', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast' },
  { id: 'csk-16', name: 'Akash Madhwal', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'csk-17', name: 'Aman Khan', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'csk-18', name: 'Matthew Short', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'csk-19', name: 'Anshul Kamboj', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'csk-20', name: 'Mukesh Choudhary', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm medium-fast' },
  { id: 'csk-21', name: 'Nathan Ellis', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'csk-22', name: 'Akeal Hosein', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'csk-23', name: 'Matt Henry', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'csk-24', name: 'Spencer Johnson', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm fast' },
  { id: 'csk-25', name: 'Shreyas Gopal', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' }
];

const rcbPlayers = [
  { id: 'rcb-1', name: 'Virat Kohli', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'rcb-2', name: 'Devdutt Padikkal', role: 'Batter', battingStyle: 'Left-hand' },
  { id: 'rcb-3', name: 'Rajat Patidar', role: 'Batter', isCaptain: true, battingStyle: 'Right-hand' },
  { id: 'rcb-4', name: 'Phil Salt', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'rcb-5', name: 'Venkatesh Iyer', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'rcb-6', name: 'Krunal Pandya', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'rcb-7', name: 'Romario Shepherd', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'rcb-8', name: 'Swapnil Singh', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'rcb-9', name: 'Bhuvneshwar Kumar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'rcb-10', name: 'Josh Hazlewood', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'rcb-11', name: 'Yash Dayal', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm fast-medium' },
  { id: 'rcb-12', name: 'Jordan Cox', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'rcb-13', name: 'Tim David', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'rcb-14', name: 'Jacob Bethell', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'rcb-15', name: 'Suyash Sharma', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' },
  { id: 'rcb-16', name: 'Jacob Duffy', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm fast-medium' },
  { id: 'rcb-17', name: 'Rasikh Salam', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'rcb-18', name: 'Nuwan Thushara', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'rcb-19', name: 'Jitesh Sharma', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'rcb-20', name: 'Vicky Ostwal', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'rcb-21', name: 'Tim Seifert', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'rcb-22', name: 'Swastik Chhikara', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'rcb-23', name: 'Mangesh Yadav', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' }
];

const miPlayers = [
  { id: 'mi-1', name: 'Hardik Pandya', role: 'All-rounder', isCaptain: true, battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'mi-2', name: 'Rohit Sharma', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'mi-3', name: 'Suryakumar Yadav', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'mi-4', name: 'Jasprit Bumrah', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast' },
  { id: 'mi-5', name: 'Tilak Varma', role: 'Batter', battingStyle: 'Left-hand' },
  { id: 'mi-6', name: 'Quinton de Kock', role: 'Wicketkeeper', isWK: true, battingStyle: 'Left-hand' },
  { id: 'mi-7', name: 'Trent Boult', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm fast-medium' },
  { id: 'mi-8', name: 'Shardul Thakur', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'mi-9', name: 'Mitchell Santner', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'mi-10', name: 'Sherfane Rutherford', role: 'Batter', battingStyle: 'Left-hand' },
  { id: 'mi-11', name: 'Mayank Markande', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' },
  { id: 'mi-12', name: 'Ryan Rickleton', role: 'Wicketkeeper', isWK: true, battingStyle: 'Left-hand' },
  { id: 'mi-13', name: 'Corbin Bosch', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'mi-14', name: 'Naman Dhir', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'mi-15', name: 'Robin Minz', role: 'Wicketkeeper', isWK: true, battingStyle: 'Left-hand' },
  { id: 'mi-16', name: 'Raj Angad Bawa', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'mi-17', name: 'Raghu Sharma', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' },
  { id: 'mi-18', name: 'Allah Ghazanfar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'mi-19', name: 'Ashwani Kumar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'mi-20', name: 'Deepak Chahar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'mi-21', name: 'Danish Malewar', role: 'Batter', battingStyle: 'Right-hand' },
  { id: 'mi-22', name: 'Mohammad Izhar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'mi-23', name: 'Atharva Ankolekar', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'mi-24', name: 'Mayank Rawat', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'mi-25', name: 'Will Jacks', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' }
];

const srhPlayers = [
  { id: 'srh-1', name: 'Pat Cummins', role: 'Bowler', isCaptain: true, battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast' },
  { id: 'srh-2', name: 'Travis Head', role: 'Batter', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'srh-3', name: 'Heinrich Klaasen', role: 'Wicketkeeper', isWK: true, battingStyle: 'Right-hand' },
  { id: 'srh-4', name: 'Abhishek Sharma', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'srh-5', name: 'Nitish Kumar Reddy', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'srh-6', name: 'Ishan Kishan', role: 'Wicketkeeper', isWK: true, battingStyle: 'Left-hand' },
  { id: 'srh-7', name: 'Liam Livingstone', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak' },
  { id: 'srh-8', name: 'Harshal Patel', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'srh-9', name: 'Jaydev Unadkat', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm medium-fast' },
  { id: 'srh-10', name: 'Dilshan Madushanka', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm fast-medium' },
  { id: 'srh-11', name: 'Gerald Coetzee', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast' },
  { id: 'srh-12', name: 'Shivam Mavi', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'srh-13', name: 'Brydon Carse', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'srh-14', name: 'Kamindu Mendis', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'srh-15', name: 'Eshan Malinga', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast-medium' },
  { id: 'srh-16', name: 'Sakib Hussain', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast' },
  { id: 'srh-17', name: 'Zeeshan Ansari', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Legbreak googly' },
  { id: 'srh-18', name: 'Onkar Tarmale', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'srh-19', name: 'Amit Kumar', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'srh-20', name: 'Praful Hinge', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium-fast' },
  { id: 'srh-21', name: 'Harsh Dubey', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm orthodox' },
  { id: 'srh-22', name: 'Shivang Kumar', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'srh-23', name: 'Krains Fuletra', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm offbreak' },
  { id: 'srh-24', name: 'R.S. Ambrish', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' },
  { id: 'srh-25', name: 'Jack Edwards', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium' }
];

const defaultData = {
  tournaments: [],
  teams: [
    {
      id: 'team-csk',
      createdAt: Date.now(),
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      color: '#facc15',
      players: cskPlayers
    },
    {
      id: 'team-rcb',
      createdAt: Date.now(),
      name: 'Royal Challengers Bengaluru',
      shortName: 'RCB',
      color: '#ef4444',
      players: rcbPlayers
    },
    {
      id: 'team-mi',
      createdAt: Date.now(),
      name: 'Mumbai Indians',
      shortName: 'MI',
      color: '#0ea5e9',
      players: miPlayers
    },
    {
      id: 'team-srh',
      createdAt: Date.now(),
      name: 'Sunrisers Hyderabad',
      shortName: 'SRH',
      color: '#f97316',
      players: srhPlayers
    }
  ],
  matches: [],
  players: [],
};

export function CricketProvider({ children }) {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.teams || parsed.teams.length === 0) {
          parsed.teams = defaultData.teams;
        }
        setData(parsed);
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    }
    setLoaded(true);
  }, []);

  const save = useCallback((newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  // --- Tournaments ---
  const addTournament = (t) => {
    const tournament = { ...t, id: genId(), createdAt: Date.now(), status: 'upcoming' };
    let newMatches = [];
    
    if (t.tier === 'premium') {
      if (t.fixtureMode === 'manual' && t.manualFixtures?.length > 0) {
        t.manualFixtures.forEach(mf => {
          if (mf.team1Id && mf.team2Id) {
            newMatches.push({
              id: genId(),
              createdAt: Date.now(),
              date: mf.date || null,
              tournamentId: tournament.id,
              team1Id: mf.team1Id,
              team2Id: mf.team2Id,
              stage: 'Group Stage',
              status: 'upcoming',
              tossWinner: null,
              tossChoice: null,
              currentInnings: 0,
              playingXI: {},
              substitutions: [],
              innings: [
                createInnings(mf.team1Id),
                createInnings(mf.team2Id),
              ],
              result: null,
            });
          }
        });
      } else if ((!t.fixtureMode || t.fixtureMode === 'auto') && t.structure === 'round-robin' && t.teams.length >= 2) {
        const cycles = t.matchesPerTeam || 1;
        const n = t.teams.length;
        for (let cycle = 0; cycle < cycles; cycle++) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              newMatches.push({
                id: genId(),
                createdAt: Date.now(),
                tournamentId: tournament.id,
                team1Id: t.teams[i],
                team2Id: t.teams[j],
                stage: 'Group Stage',
                status: 'upcoming',
                tossWinner: null,
                tossChoice: null,
                currentInnings: 0,
                playingXI: {},
                substitutions: [],
                innings: [
                  createInnings(t.teams[i]),
                  createInnings(t.teams[j]),
                ],
                result: null,
              });
            }
          }
        }
      }
    }

    save({ 
      ...data, 
      tournaments: [...data.tournaments, tournament],
      matches: [...data.matches, ...newMatches]
    });
    return tournament;
  };

  const updateTournament = (id, updates) => {
    save({
      ...data,
      tournaments: data.tournaments.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  };

  const deleteTournament = (id) => {
    save({
      ...data,
      tournaments: data.tournaments.filter(t => t.id !== id),
      matches: data.matches.filter(m => m.tournamentId !== id),
    });
  };

  // --- Teams ---
  const addTeam = (t) => {
    const team = { ...t, id: genId(), createdAt: Date.now(), players: t.players || [] };
    save({ ...data, teams: [...data.teams, team] });
    return team;
  };

  const updateTeam = (id, updates) => {
    save({
      ...data,
      teams: data.teams.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  };

  const deleteTeam = (id) => {
    save({ ...data, teams: data.teams.filter(t => t.id !== id) });
  };

  const addPlayerToTeam = (teamId, player) => {
    const p = { ...player, id: genId() };
    save({
      ...data,
      teams: data.teams.map(t =>
        t.id === teamId ? { ...t, players: [...(t.players || []), p] } : t
      ),
    });
    return p;
  };

  const removePlayerFromTeam = (teamId, playerId) => {
    save({
      ...data,
      teams: data.teams.map(t =>
        t.id === teamId ? { ...t, players: (t.players || []).filter(p => p.id !== playerId) } : t
      ),
    });
  };

  const updatePlayerInTeam = (teamId, playerId, updates) => {
    save({
      ...data,
      teams: data.teams.map(t =>
        t.id === teamId
          ? { ...t, players: (t.players || []).map(p => p.id === playerId ? { ...p, ...updates } : p) }
          : t
      ),
    });
  };

  // --- Matches ---
  const addMatch = (m) => {
    const match = {
      ...m,
      id: genId(),
      createdAt: Date.now(),
      status: 'upcoming', // upcoming | live | completed
      tossWinner: null,
      tossChoice: null,
      currentInnings: 0,
      playingXI: {},
      substitutions: [],
      innings: [
        createInnings(m.team1Id),
        createInnings(m.team2Id),
      ],
      result: null,
    };
    save({ ...data, matches: [...data.matches, match] });
    return match;
  };

  const updateMatch = (id, updates) => {
    save({
      ...data,
      matches: data.matches.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  };

  const deleteMatch = (id) => {
    save({ ...data, matches: data.matches.filter(m => m.id !== id) });
  };

  const getMatch = (id) => data.matches.find(m => m.id === id);
  const getTeam = (id) => data.teams.find(t => t.id === id);
  const getTournament = (id) => data.tournaments.find(t => t.id === id);

  // --- Live Scoring ---
  const recordBall = (matchId, delivery) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;

    const inningsIdx = match.currentInnings;
    
    // Create snapshot for undo feature
    const snapshot = JSON.parse(JSON.stringify(match.innings[inningsIdx]));
    // don't store recursive history
    snapshot.history = [];

    const innings = { ...match.innings[inningsIdx] };
    innings.history = [...(innings.history || []), snapshot];

    // Find current batsman
    const strikerIdx = innings.batting.findIndex(b => b.isStriker);
    const nonStrikerIdx = innings.batting.findIndex(b => b.isNonStriker);

    // Extras
    const isExtra = ['wide', 'noball', 'bye', 'legbye'].includes(delivery.type);
    const isWicket = delivery.type === 'wicket';
    const runs = delivery.runs || 0;

    // Update score
    innings.runs += runs;
    if (!['wide', 'noball'].includes(delivery.type)) {
      // Legal deliveries don't add to ball count for wide/nb
    }
    
    if (delivery.type === 'wide') {
      innings.extras.wides += (runs + 1); // wide + any runs
      innings.runs += 1;
    } else if (delivery.type === 'noball') {
      innings.extras.noballs += 1;
      innings.runs += 1;
    } else if (delivery.type === 'bye') {
      innings.extras.byes += runs;
    } else if (delivery.type === 'legbye') {
      innings.extras.legbyes += runs;
    }

    // Partnership updates
    if (!innings.currentPartnership) innings.currentPartnership = { runs: 0, balls: 0 };
    innings.currentPartnership.runs += runs;
    if (delivery.type === 'wide' && runs > 0) {
      // Wides don't usually add partnership runs except boundaries/overthrows, handled above
    } else if (delivery.type === 'wide') {
      innings.currentPartnership.runs += 1; // Wide adds 1 to team score/partnership
    } else if (delivery.type === 'noball') {
      innings.currentPartnership.runs += 1; // No ball adds 1 to team score/partnership
    }

    // Legal ball
    const isLegalBall = !['wide', 'noball'].includes(delivery.type);
    if (isLegalBall || delivery.type === 'noball') {
      innings.currentPartnership.balls += 1;
    }

    if (isLegalBall) {
      innings.balls += 1;
      // Update striker stats
      if (strikerIdx >= 0) {
        const batter = { ...innings.batting[strikerIdx] };
        if (!['bye', 'legbye'].includes(delivery.type)) {
          batter.runs += runs;
          if (runs === 4) batter.fours += 1;
          if (runs === 6) batter.sixes += 1;
        }
        batter.balls += 1;
        batter.strikeRate = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '0.0';
        innings.batting[strikerIdx] = batter;
      }
    } else {
      // No ball: count ball for batter stats
      if (delivery.type === 'noball' && strikerIdx >= 0) {
        const batter = { ...innings.batting[strikerIdx] };
        batter.runs += runs;
        if (runs === 4) batter.fours += 1;
        if (runs === 6) batter.sixes += 1;
        innings.batting[strikerIdx] = batter;
      }
    }

    // Wicket
    if (isWicket) {
      innings.wickets += 1;
      
      // Fall of wicket
      const overStr = `${Math.floor(innings.balls / 6)}.${innings.balls % 6}`;
      innings.fow = [...(innings.fow || []), {
        runs: innings.runs,
        wickets: innings.wickets,
        over: overStr,
        batsmanId: strikerIdx >= 0 ? innings.batting[strikerIdx]?.id : null,
      }];
      
      // Reset partnership
      innings.currentPartnership = { runs: 0, balls: 0 };

      if (strikerIdx >= 0) {
        innings.batting[strikerIdx] = {
          ...innings.batting[strikerIdx],
          dismissal: delivery.dismissalType || 'out',
          dismissedBy: delivery.bowlerId,
          fielderId: delivery.fielderId,
          isStriker: false,
          isOut: true,
        };
      }
    }

    // Update bowler
    const bowlerIdx = innings.bowling.findIndex(b => b.id === delivery.bowlerId);
    if (bowlerIdx >= 0) {
      const bowler = { ...innings.bowling[bowlerIdx] };
      if (isLegalBall) {
        bowler.balls = (bowler.balls || 0) + 1;
        bowler.overs = `${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}`;
      }
      if (!isExtra) {
        bowler.runs = (bowler.runs || 0) + runs;
      } else {
        bowler.runs = (bowler.runs || 0) + (delivery.type === 'wide' ? runs + 1 : delivery.type === 'noball' ? 1 : 0);
      }
      if (isWicket && !['runout'].includes(delivery.dismissalType)) {
        bowler.wickets = (bowler.wickets || 0) + 1;
      }
      bowler.economy = bowler.balls > 0 ? ((bowler.runs / bowler.balls) * 6).toFixed(2) : '0.00';
      innings.bowling[bowlerIdx] = bowler;
    }

    // Generate Commentary
    const overStr = isLegalBall ? `${Math.floor((innings.balls-1) / 6)}.${((innings.balls-1) % 6) + 1}` : `${Math.floor(innings.balls / 6)}.${innings.balls % 6}`;
    const bowlerName = bowlerIdx >= 0 ? innings.bowling[bowlerIdx].name : 'Bowler';
    const batterName = strikerIdx >= 0 ? innings.batting[strikerIdx].name : 'Batter';
    let commText = `${bowlerName} to ${batterName}, `;
    if (isWicket) {
      if (delivery.dismissalType === 'bowled') commText += 'OUT! Bowled him! Through the gate!';
      else if (delivery.dismissalType === 'caught') commText += 'OUT! Edged and taken!';
      else if (delivery.dismissalType === 'lbw') commText += 'OUT! Plumb in front, given LBW!';
      else if (delivery.dismissalType === 'runout') commText += `OUT! Direct hit, run out!`;
      else if (delivery.dismissalType === 'stumped') commText += 'OUT! Beaten by the spin, stumped!';
      else commText += 'OUT!';
    } else if (delivery.type === 'wide') {
      commText += `WIDE! Slipped down the leg side. ${runs > 0 ? `+ ${runs} runs` : ''}`;
    } else if (delivery.type === 'noball') {
      commText += `NO BALL! Overstepped the line. ${runs > 0 ? `+ ${runs} runs` : ''}`;
    } else if (runs === 6) {
      commText += 'SIX! MASSIVE HIT! Out of the park!';
    } else if (runs === 4) {
      commText += 'FOUR! Smacked through the gap, beautiful shot!';
    } else if (runs === 0) {
      commText += 'no run, defended solidly.';
    } else {
      commText += `${runs} run${runs > 1 ? 's' : ''}, pushed into the gap.`;
    }

    // Ball history
    const ballRecord = {
      type: delivery.type,
      runs: delivery.type === 'wide' ? runs + 1 : runs,
      display: isWicket ? 'W' : delivery.type === 'wide' ? 'Wd' : delivery.type === 'noball' ? 'Nb' : delivery.type === 'bye' ? `${runs}b` : delivery.type === 'legbye' ? `${runs}lb` : String(runs),
      bowlerId: delivery.bowlerId,
      batsmanId: strikerIdx >= 0 ? innings.batting[strikerIdx]?.id : null,
      commentary: commText,
      over: overStr
    };
    innings.ballHistory = [...(innings.ballHistory || []), ballRecord];

    // Rotate strike on odd runs (not wide)
    if (!['wide', 'noball'].includes(delivery.type)) {
      const shouldRotate = runs % 2 === 1;
      if (shouldRotate && strikerIdx >= 0 && nonStrikerIdx >= 0) {
        innings.batting[strikerIdx] = { ...innings.batting[strikerIdx], isStriker: false, isNonStriker: true };
        innings.batting[nonStrikerIdx] = { ...innings.batting[nonStrikerIdx], isNonStriker: false, isStriker: true };
      }
    }

    // End of over (legal balls = 6)
    if (isLegalBall && innings.balls % 6 === 0 && innings.balls > 0) {
      // Rotate strike at end of over
      const newStrikerIdx = innings.batting.findIndex(b => b.isStriker);
      const newNonStrikerIdx = innings.batting.findIndex(b => b.isNonStriker);
      if (newStrikerIdx >= 0 && newNonStrikerIdx >= 0) {
        innings.batting[newStrikerIdx] = { ...innings.batting[newStrikerIdx], isStriker: false, isNonStriker: true };
        innings.batting[newNonStrikerIdx] = { ...innings.batting[newNonStrikerIdx], isNonStriker: false, isStriker: true };
      }
    }

    const newInnings = [...match.innings];
    newInnings[inningsIdx] = innings;

    // Check end of innings conditions
    const teamId = innings.teamId;
    const playingXICount = match.playingXI?.[teamId]?.length;
    const teamSize = playingXICount > 0 ? playingXICount : (data.teams.find(t => t.id === teamId)?.players?.length || 11);
    const maxWickets = Math.max(1, teamSize - 1);
    
    const totalOvers = match.totalOvers || 20;
    const oversCompleted = innings.balls >= totalOvers * 6;
    const allOut = innings.wickets >= maxWickets;
    const target = match.currentInnings === 1 ? (match.innings[0].runs + 1) : null;
    const chaseComplete = target && innings.runs >= target;

    let matchUpdates = { innings: newInnings };

    if (chaseComplete) {
      const wicketsLeft = maxWickets - innings.wickets;
      matchUpdates.status = 'completed';
      matchUpdates.result = {
        winner: innings.teamId,
        margin: `${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`,
        type: 'wickets',
      };
    } else if (oversCompleted || allOut) {
      if (match.currentInnings === 0) {
        matchUpdates.currentInnings = 1;
        matchUpdates.status = 'live';
      } else {
        const team1Runs = match.innings[0].runs;
        const team2Runs = innings.runs;
        matchUpdates.status = 'completed';
        if (team1Runs > team2Runs) {
          matchUpdates.result = {
            winner: match.innings[0].teamId,
            margin: `${team1Runs - team2Runs} run${team1Runs - team2Runs !== 1 ? 's' : ''}`,
            type: 'runs',
          };
        } else if (team2Runs > team1Runs) {
          const wicketsLeft = maxWickets - innings.wickets;
          matchUpdates.result = {
            winner: innings.teamId,
            margin: `${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`,
            type: 'wickets',
          };
        } else {
          matchUpdates.result = { winner: null, margin: 'Tie', type: 'tie' };
        }
      }
    }

    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? { ...m, ...matchUpdates } : m),
    });
  };

  const startMatch = (matchId, { tossWinner, tossChoice, battingTeamId, bowlingTeamId, battingLineup, bowlingLineup, playingXI }) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;

    const innings = [...match.innings];
    innings[0] = {
      ...innings[0],
      teamId: battingTeamId,
      batting: battingLineup.map((p, i) => ({
        ...p,
        runs: 0, balls: 0, fours: 0, sixes: 0,
        strikeRate: '0.0',
        isStriker: i === 0,
        isNonStriker: i === 1,
        isOut: false,
        dismissal: null,
        dismissedBy: null,
      })),
      bowling: bowlingLineup.map(p => ({
        ...p,
        overs: '0.0', balls: 0, runs: 0, wickets: 0, economy: '0.00',
        maidens: 0,
      })),
      runs: 0, balls: 0, wickets: 0,
      currentBowlerId: bowlingLineup[0]?.id || null,
      extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
      ballHistory: [],
      fow: [],
      currentPartnership: { runs: 0, balls: 0 },
      history: [],
    };
    innings[1] = {
      ...innings[1],
      teamId: bowlingTeamId,
      batting: [],
      bowling: [],
      runs: 0, balls: 0, wickets: 0,
      extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
      ballHistory: [],
      fow: [],
      currentPartnership: { runs: 0, balls: 0 },
      history: [],
    };

    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? {
        ...m,
        status: 'live',
        tossWinner, tossChoice,
        playingXI,
        substitutions: m.substitutions || [],
        currentInnings: 0,
        innings,
      } : m),
    });
  };

  const setInningsLineup = (matchId, inningsIdx, batting, bowling) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const innings = [...match.innings];
    innings[inningsIdx] = {
      ...innings[inningsIdx],
      batting: batting.map((p, i) => ({
        ...p, runs: 0, balls: 0, fours: 0, sixes: 0,
        strikeRate: '0.0', isStriker: i === 0, isNonStriker: i === 1,
        isOut: false, dismissal: null, dismissedBy: null,
      })),
      bowling: bowling.map(p => ({
        ...p, overs: '0.0', balls: 0, runs: 0, wickets: 0,
        economy: '0.00', maidens: 0,
      })),
      currentBowlerId: bowling[0]?.id || null,
    };
    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? { ...m, innings } : m),
    });
  };

  const setBowler = (matchId, inningsIdx, bowler) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const innings = [...match.innings];
    const idx = innings[inningsIdx].bowling.findIndex(b => b.id === bowler.id);
    if (idx < 0) {
      innings[inningsIdx] = {
        ...innings[inningsIdx],
        currentBowlerId: bowler.id,
        bowling: [...innings[inningsIdx].bowling, {
          ...bowler, overs: '0.0', balls: 0, runs: 0, wickets: 0, economy: '0.00', maidens: 0,
        }],
      };
    } else {
      innings[inningsIdx] = {
        ...innings[inningsIdx],
        currentBowlerId: bowler.id,
      };
    }
    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? { ...m, innings } : m),
    });
  };

  const setNewBatsman = (matchId, inningsIdx, player) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const innings = { ...match.innings[inningsIdx] };
    innings.batting = [...innings.batting, {
      ...player, runs: 0, balls: 0, fours: 0, sixes: 0,
      strikeRate: '0.0', isStriker: true, isNonStriker: false,
      isOut: false, dismissal: null, dismissedBy: null,
    }];
    const newInnings = [...match.innings];
    newInnings[inningsIdx] = innings;
    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? { ...m, innings: newInnings } : m),
    });
  };

  const undoBall = (matchId) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;

    let inningsIdx = match.currentInnings;
    let innings = match.innings[inningsIdx];

    // If we just started the 2nd innings and haven't bowled a ball, we might need to revert to 1st innings
    if (inningsIdx === 1 && innings.balls === 0 && (!innings.history || innings.history.length === 0)) {
      inningsIdx = 0;
      innings = match.innings[0];
    }

    if (!innings.history || innings.history.length === 0) return; // nothing to undo

    const previousState = innings.history.pop();
    
    const newInningsList = [...match.innings];
    newInningsList[inningsIdx] = previousState;
    
    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? {
        ...m,
        status: 'live',
        result: null,
        currentInnings: inningsIdx,
        innings: newInningsList,
      } : m),
    });
  };

  const applySubstitution = (matchId, teamId, playerOutId, playerInId) => {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;

    const teamPlayingXI = match.playingXI?.[teamId] || [];
    const newPlayingXI = teamPlayingXI.map(id => id === playerOutId ? playerInId : id);

    const subRecord = {
      teamId,
      playerOutId,
      playerInId,
      over: `${Math.floor(match.innings[match.currentInnings]?.balls / 6) || 0}.${(match.innings[match.currentInnings]?.balls % 6) || 0}`
    };

    save({
      ...data,
      matches: data.matches.map(m => m.id === matchId ? {
        ...m,
        playingXI: { ...m.playingXI, [teamId]: newPlayingXI },
        substitutions: [...(m.substitutions || []), subRecord]
      } : m),
    });
  };

  const value = {
    ...data,
    loaded,
    addTournament, updateTournament, deleteTournament, getTournament,
    addTeam, updateTeam, deleteTeam, addPlayerToTeam, removePlayerFromTeam, updatePlayerInTeam, getTeam,
    addMatch, updateMatch, deleteMatch, getMatch,
    recordBall, undoBall, startMatch, setInningsLineup, setBowler, setNewBatsman, applySubstitution,
  };

  return <CricketContext.Provider value={value}>{children}</CricketContext.Provider>;
}

export function useCricket() {
  const ctx = useContext(CricketContext);
  if (!ctx) throw new Error('useCricket must be used within CricketProvider');
  return ctx;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createInnings(teamId) {
  return {
    teamId,
    runs: 0,
    wickets: 0,
    balls: 0,
    currentBowlerId: null,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
    batting: [],
    bowling: [],
    ballHistory: [],
    fow: [],
    currentPartnership: { runs: 0, balls: 0 },
    history: [],
  };
}
