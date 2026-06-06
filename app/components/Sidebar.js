'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCricket } from '../store/cricketStore';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', href: '/' },
  { label: 'Tournaments', icon: '🏆', href: '/tournaments' },
  { label: 'Teams', icon: '👥', href: '/teams' },
  { label: 'Matches', icon: '🏏', href: '/matches' },

];

export default function Sidebar() {
  const pathname = usePathname();
  const { matches } = useCricket();
  const liveCount = matches.filter(m => m.status === 'live').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🏏</div>
        <div>
          <div className="logo-text">CricManager</div>
          <div className="logo-sub">Scorecard Pro</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Matches' && liveCount > 0 && (
                <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 11 }}>
                  {liveCount} Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {liveCount > 0 ? (
          <div className="live-badge">
            <div className="live-dot"></div>
            {liveCount} match{liveCount > 1 ? 'es' : ''} live
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 4px' }}>
            No live matches
          </div>
        )}
      </div>
    </aside>
  );
}
