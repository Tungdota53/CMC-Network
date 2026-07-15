import { useState } from 'react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

interface Node {
  id: string;
  location: string;
  uptime: string;
  status: 'active' | 'warning' | 'offline';
}

const stats: StatCard[] = [
  { title: 'Active Nodes', value: '1,482', change: '+5.2%', positive: true, icon: '🌐' },
  { title: 'Network Latency', value: '22ms', change: '-3ms', positive: true, icon: '⚡' },
  { title: 'Data Throughput', value: '14.8 Gbps', change: '+12%', positive: true, icon: '📊' },
  { title: 'Total Events', value: '105,739', change: '+1.5%', positive: true, icon: '🔔' },
];

const nodes: Node[] = [
  { id: '1', location: 'San Francisco (SF)', uptime: '99.8%', status: 'active' },
  { id: '2', location: 'New York (NY)', uptime: '99.9%', status: 'active' },
  { id: '3', location: 'London (LDN)', uptime: '99.6%', status: 'warning' },
  { id: '4', location: 'Tokyo (TYO)', uptime: '99.9%', status: 'active' },
  { id: '5', location: 'Singapore (SGP)', uptime: '99.8%', status: 'active' },
];

const navItems = [
  { icon: '📊', label: 'Dashboard', active: true },
  { icon: '🌐', label: 'Network Nodes', active: false },
  { icon: '📈', label: 'Analytics', active: false },
  { icon: '🏢', label: 'Infrastructure', active: false },
  { icon: '🛡️', label: 'Security', active: false },
  { icon: '⚙️', label: 'Settings', active: false },
];

const CMCLogo = () => (
  <div className="cmc-logo-icon">
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 40 C 5 40, 5 20, 25 20 C 30 5, 55 5, 65 15 C 75 5, 95 10, 95 30 C 100 30, 100 40, 85 40 Z" />
      <path d="M 28 40 L 40 20 L 50 40 L 60 20 L 72 40" />
      <circle cx="20" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="25" cy="20" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="65" cy="15" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="95" cy="30" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="85" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="28" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="40" cy="20" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="50" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="60" cy="20" r="3" fill="#0ea5e9" stroke="none"/>
      <circle cx="72" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
    </svg>
  </div>
);

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <CMCLogo />
          <div className="brand-text">CMC <span>NETWORK</span></div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1 className="page-title">Overview</h1>
          </div>
          <div className="search-bar">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search nodes, alerts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="metrics-grid">
          {stats.map(stat => (
            <div key={stat.title} className="glass-panel metric-card">
              <div className="metric-header">
                <span>{stat.title}</span>
                <span>{stat.icon}</span>
              </div>
              <div className="metric-value">{stat.value}</div>
              <div className={`metric-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Main Chart Area */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '500' }}>Network Activity</h3>
            <div className="chart-placeholder">
              <div className="fake-wave"></div>
              {/* Fake X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--text-muted)', fontSize: '0.8rem', zIndex: 2 }}>
                <span>06/20</span>
                <span>07/15</span>
                <span>08/10</span>
                <span>09/05</span>
                <span>10/01</span>
                <span>11/20</span>
              </div>
            </div>
          </div>

          {/* Connected Nodes List */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '500' }}>Connected Nodes</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Uptime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(node => (
                  <tr key={node.id}>
                    <td style={{ fontWeight: 500 }}>{node.location}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{node.uptime}</td>
                    <td>
                      <span className={`status-badge status-${node.status}`}>
                        {node.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}
