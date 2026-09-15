import { useState, useEffect } from 'react'
import {
  IconPlayerPlay,
  IconChartBar,
  IconCpu,
  IconShieldLock,
  IconLayoutDashboard,
  IconTerminal2,
  IconSettings,
  IconActivity,
  IconUsers
} from '@tabler/icons-react'
import './App.css'
import { OAUTH2_CONFIG, getOAuth2AuthorizeUrl, getLogoutUrl } from './config/auth'


function App() {
  const [mode, setMode] = useState<'mock' | 'live'>('mock')
  const [mockState, setMockState] = useState<'guest' | 'user' | 'admin'>('guest')
  const [consoleLogs, setConsoleLogs] = useState<string>(
    'Welcome to Astrail Quiz Battle Gateway.\nChoose a matchmaker sector below to initiate matchmaker telemetry...'
  )

  // 3D Tilt interactive effect state
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'rotateX(2deg) rotateY(-1deg)'
  })

  // For live mode: check if user is authenticated by querying the backend.
  const [liveUser, setLiveUser] = useState<{
    authenticated: boolean
    username: string
    userId: string
    roles: string
  } | null>(null)

  // Automatically fetch profile status in Live mode
  useEffect(() => {
    if (mode === 'live') {
      setConsoleLogs(`Initializing Live connection to Astrail API (${OAUTH2_CONFIG.apiBaseUrl})...`)
      fetch(`${OAUTH2_CONFIG.apiBaseUrl}/api/test/user`, {
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(async res => {
          if (res.status === 200) {
            const data = await res.json()
            setLiveUser({
              authenticated: true,
              username: data.username || 'user@astrail.com',
              userId: data.userId || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              roles: (data.roles || []).join(', ') || 'ROLE_USER'
            })
            setConsoleLogs(
              `[Live Connection Status]\n` +
              `Connection Established successfully!\n` +
              `Status      : 200 OK\n` +
              `Challenger Name : ${data.username}\n` +
              `Celestial Roles : ${(data.roles || []).join(', ')}`
            )
          } else {
            setLiveUser({
              authenticated: false,
              username: '',
              userId: '',
              roles: ''
            })
            setConsoleLogs(
              `[Live Connection Status]\n` +
              `Connection Closed/Unauthenticated.\n` +
              `Status      : ${res.status} ${res.statusText}\n` +
              `Please click "Enter the Starry Sky" to log in.`
            )
          }
        })
        .catch(err => {
          setLiveUser({
            authenticated: false,
            username: '',
            userId: '',
            roles: ''
          })
          setConsoleLogs(
            `[Live Connection Failed]\n` +
            `Could not resolve Astrail Gateway server on ${OAUTH2_CONFIG.apiBaseUrl}.\n` +
            `Make sure your Spring Boot backend application is running.\n\n` +
            `Error: ${err.message}`
          )
        })
    } else {
      // Mock mode reset
      setLiveUser(null)
      setConsoleLogs('Switched to Simulation Sandbox.\nChoose a matchmaker sector below to initiate matchmaker telemetry...')
    }
  }, [mode])

  // Trigger test endpoints
  const handleTest = async (endpoint: string, description: string) => {
    setConsoleLogs(`${description}\n\n`)
    const startTime = performance.now()

    if (mode === 'mock') {
      // Simulation flow
      setTimeout(() => {
        const duration = (performance.now() - startTime).toFixed(1)
        let status = '200 OK'
        let payload: any = {}

        if (endpoint === '/api/test/public') {
          payload = {
            status: 'Success',
            message: 'Entered the Public Orbit lobby. Ready for pairing! (Simulated)',
            endpoint: '/api/test/public',
            timestamp: Date.now()
          }
        } else if (endpoint === '/api/test/user') {
          if (mockState === 'guest') {
            status = '401 Unauthorized'
            payload = {
              status: 'Error',
              message: 'Authentication required. Please enter the Challenger Gate.',
              path: '/api/test/user'
            }
          } else {
            payload = {
              status: 'Success',
              message: 'Welcome to the Challenger Orbit. Matchmaking queue active! (Simulated)',
              endpoint: '/api/test/user',
              username: mockState === 'admin' ? 'admin@astrail.com' : 'user@astrail.com',
              roles: mockState === 'admin' ? ['ROLE_USER', 'ROLE_ADMIN'] : ['ROLE_USER'],
              timestamp: Date.now()
            }
          }
        } else if (endpoint === '/api/test/admin') {
          if (mockState === 'admin') {
            payload = {
              status: 'Success',
              message: 'Fox Spirit Shrine gate opened! Mystic score multipliers online. (Simulated)',
              endpoint: '/api/test/admin',
              username: 'admin@astrail.com',
              roles: ['ROLE_USER', 'ROLE_ADMIN'],
              timestamp: Date.now()
            }
          } else if (mockState === 'user') {
            status = '403 Forbidden'
            payload = {
              status: 'Error',
              message: 'Access Denied: Subject signature does not have Fox Spirit clearance.',
              path: '/api/test/admin'
            }
          } else {
            status = '401 Unauthorized'
            payload = {
              status: 'Error',
              message: 'Authentication required. Access to the Fox Spirit Shrine is forbidden.',
              path: '/api/test/admin'
            }
          }
        } else if (endpoint === '/api/test/grant-admin') {
          if (mockState === 'guest') {
            status = '400 Bad Request'
            payload = { status: 'Error', message: 'You must log in to elevate challenger rank.' }
          } else {
            setMockState('admin')
            payload = {
              status: 'Success',
              message: 'Fox Spirit blessings granted! Challenger rank elevated to ADMIN.'
            }
          }
        } else if (endpoint === '/api/test/revoke-admin') {
          if (mockState === 'guest') {
            status = '400 Bad Request'
            payload = { status: 'Error', message: 'You must log in to adjust challenger rank.' }
          } else {
            setMockState('user')
            payload = {
              status: 'Success',
              message: 'Fox Spirit blessings returned. Challenger rank returned to USER.'
            }
          }
        }

        let output = `[Simulated Matchmaker Telemetry]\n`
        output += `Target Gateway : ${endpoint}\n`
        output += `Status Code    : ${status}\n`
        output += `Duration       : ${duration} ms\n\n`
        output += `[Lobby Payload Response]\n`
        output += JSON.stringify(payload, null, 4)

        setConsoleLogs(output)
      }, 400)
    } else {
      // Live API call flow
      const url = `${OAUTH2_CONFIG.apiBaseUrl}${endpoint}`
      fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(async response => {
          const duration = (performance.now() - startTime).toFixed(1)
          const statusText = response.status + ' ' + response.statusText

          let data
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            data = await response.json()
          } else {
            data = await response.text()
          }

          let output = `[Request Telemetry]\n`
          output += `Target URL : ${url}\n`
          output += `Status Code: ${statusText}\n`
          output += `Duration   : ${duration} ms\n\n`
          output += `[Payload Response]\n`

          if (typeof data === 'object') {
            output += JSON.stringify(data, null, 4)
          } else {
            output += data
          }

          setConsoleLogs(output)
        })
        .catch(error => {
          const duration = (performance.now() - startTime).toFixed(1)
          let output = `[Telemetry Failed]\n`
          output += `Target URL : ${url}\n`
          output += `Duration   : ${duration} ms\n\n`
          output += `[Error Details]\n`
          output += error.toString()

          setConsoleLogs(output)
        })
    }
  }

  // Interactive 3D mouse tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left - box.width / 2
    const y = e.clientY - box.top - box.height / 2
    const rotateX = -(y / (box.height / 2)) * 4 // Max 4 degrees
    const rotateY = (x / (box.width / 2)) * 4 // Max 4 degrees

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    })
  }

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(2deg) rotateY(-1deg)',
      transition: 'transform 0.5s ease-out'
    })
  }

  // Determine current display info
  const isAuthenticated = mode === 'mock' ? mockState !== 'guest' : !!(liveUser && liveUser.authenticated)
  const username = mode === 'mock' ? (mockState === 'admin' ? 'admin@astrail.com' : 'user@astrail.com') : (liveUser?.username || '')
  const userId = mode === 'mock' ? '8c223c14-2cc3-4b92-b883-e18c5e0031ff' : (liveUser?.userId || '')
  const roles = mode === 'mock' ? (mockState === 'admin' ? 'ROLE_USER, ROLE_ADMIN' : 'ROLE_USER') : (liveUser?.roles || '')

  return (
    <div className="app-wrapper">
      {/* Background celestial styling */}
      <div className="cosmic-bg">
        <div className="nebula-glow-1"></div>
        <div className="nebula-glow-2"></div>

        {/* Twinkling stars */}
        <svg className="celestial-star" style={{ top: '12%', left: '8%', animationDelay: '0s' }} width="8" height="8" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" /></svg>
        <svg className="celestial-star" style={{ top: '45%', left: '5%', animationDelay: '1.5s' }} width="12" height="12" viewBox="0 0 10 10"><circle cx="5" cy="5" r="1.5" /></svg>
        <svg className="celestial-star" style={{ top: '85%', left: '12%', animationDelay: '3s' }} width="6" height="6" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.5" /></svg>
        <svg className="celestial-star" style={{ top: '75%', left: '88%', animationDelay: '0.5s' }} width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" /></svg>
        <svg className="celestial-star" style={{ top: '22%', left: '92%', animationDelay: '2s' }} width="8" height="8" viewBox="0 0 10 10"><circle cx="5" cy="5" r="1.5" /></svg>
        <svg className="celestial-star" style={{ top: '92%', left: '45%', animationDelay: '1s' }} width="12" height="12" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2" /></svg>
      </div>

      {/* Constellation overlay */}
      <svg className="fox-constellation" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#D4AF37" strokeWidth="0.75" opacity="0.4" strokeDasharray="3 3">
          <line x1="200" y1="80" x2="230" y2="40" /><line x1="230" y1="40" x2="250" y2="70" /><line x1="250" y1="70" x2="200" y2="80" />
          <line x1="200" y1="80" x2="170" y2="40" /><line x1="170" y1="40" x2="150" y2="70" /><line x1="150" y1="70" x2="200" y2="80" />
          <line x1="200" y1="80" x2="200" y2="130" /><line x1="200" y1="130" x2="260" y2="145" /><line x1="260" y1="145" x2="200" y2="170" />
          <line x1="200" y1="170" x2="140" y2="145" /><line x1="140" y1="145" x2="200" y2="130" />
          <line x1="140" y1="145" x2="110" y2="240" /><line x1="200" y1="170" x2="200" y2="250" /><line x1="260" y1="145" x2="290" y2="240" />
          <line x1="110" y1="240" x2="90" y2="340" /><line x1="290" y1="240" x2="310" y2="340" />
          <line x1="90" y1="340" x2="140" y2="410" /><line x1="310" y1="340" x2="260" y2="410" /><line x1="140" y1="410" x2="200" y2="250" /><line x1="260" y1="410" x2="200" y2="250" />
          <line x1="140" y1="410" x2="80" y2="440" /><line x1="80" y1="440" x2="50" y2="340" /><line x1="50" y1="340" x2="100" y2="280" />
          <line x1="260" y1="410" x2="320" y2="440" /><line x1="320" y1="440" x2="350" y2="340" /><line x1="350" y1="340" x2="300" y2="280" />
        </g>
        <g fill="#D4AF37">
          <circle cx="200" cy="80" r="3" /><circle cx="230" cy="40" r="2.5" /><circle cx="250" cy="70" r="2.5" /><circle cx="170" cy="40" r="2.5" /><circle cx="150" cy="70" r="2.5" />
          <circle cx="200" cy="130" r="3" /><circle cx="260" cy="145" r="4" filter="url(#glow)" /><circle cx="200" cy="170" r="3" /><circle cx="140" cy="145" r="4" filter="url(#glow)" />
          <circle cx="110" cy="240" r="3" /><circle cx="200" cy="250" r="3" /><circle cx="290" cy="240" r="3" />
          <circle cx="90" cy="340" r="2.5" /><circle cx="310" cy="340" r="2.5" />
          <circle cx="140" cy="410" r="3" /><circle cx="260" cy="410" r="3" />
          <circle cx="80" cy="440" r="3" /><circle cx="50" cy="340" r="3" /><circle cx="100" cy="280" r="2" />
          <circle cx="320" cy="440" r="3" /><circle cx="350" cy="340" r="3" /><circle cx="300" cy="280" r="2" />
        </g>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Gold Sparkle decoration */}
      <svg className="sparkle-bottom-right" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 30 0 Q 30 30 0 30 Q 30 30 30 60 Q 30 30 60 30 Q 30 30 30 0" fill="url(#goldGradient)" />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3C4" /><stop offset="50%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#9E7815" />
          </linearGradient>
        </defs>
      </svg>

      {/* [01. NAVBAR SECTION] */}
      <header className="navbar">
        <div className="navbar-container">
          <a href="#" className="navbar-left">
            <img src="/logo.png" className="navbar-logo" alt="ASTRAIL Logo" />
            <span className="navbar-brand">ASTRAIL</span>
          </a>
          <nav className="navbar-center">
            <a href="#features" className="nav-link">Features</a>
            <a href="#solutions" className="nav-link">Solutions</a>
            <a href="#docs" className="nav-link">Documentation</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </nav>
          <div className="navbar-right">
            <button className="btn-signin" onClick={() => window.location.href = getOAuth2AuthorizeUrl()}>Sign In</button>
            <button className="btn-getstarted" onClick={() => window.location.href = getOAuth2AuthorizeUrl()}>Get Started</button>
          </div>
        </div>
      </header>

      {/* [02. HERO SECTION] */}
      <main>
        <section className="hero-section">
          <div className="hero-badge">
            <span className="badge-new">NEW</span>
            <span className="badge-text">Astrail v2.0 is live &rarr;</span>
          </div>
          <h1 className="hero-headline">
            Navigate the Starry Trails of Fox Spirit Quiz Battles.
          </h1>
          <p className="hero-subheadline">
            Challenge players across the galaxy in real-time quiz duels, harness the wisdom of the fox spirits, and climb the celestial leaderboards.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary-cta">Start Free Trial</button>
            <button className="btn-secondary-cta">
              <IconPlayerPlay size={16} fill="currentColor" />
              <span>View Live Demo</span>
            </button>
          </div>
        </section>

        {/* [03. FEATURE HIGHLIGHTS] */}
        <section id="features" className="features-section">
          <h2 className="section-title">Engineered for Cosmic Scale</h2>
          <div className="features-grid">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconChartBar size={24} />
              </div>
              <h3>Celestial Quiz Arenas</h3>
              <p>
                Challenge rivals across the stars in rapid-fire quiz duels with zero-latency question synchronization.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconCpu size={24} />
              </div>
              <h3>Fox Spirit Blessings</h3>
              <p>
                Unlock mystical power-ups and trivia blessings from the celestial fox spirits to double your score.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <IconShieldLock size={24} />
              </div>
              <h3>High-Concurrency Engine</h3>
              <p>
                Powered by our reactive event loop cluster capable of hosting millions of concurrent trivia combatants.
              </p>
            </div>
          </div>
        </section>

        {/* [04. FOOTER & MOCK UI SECTION] */}
        <section className="dashboard-section">
          <div
            className="dashboard-tilt-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tiltStyle}
          >
            <div className="dashboard-frame">
              <div className="dashboard-inner">
                {/* Simulated Sidebar */}
                <aside className="db-sidebar">
                  <div>
                    <div className="db-logo">
                      <img src="/logo.png" alt="Astrail emblem" />
                      <span>ASTRAIL ARENA</span>
                    </div>
                    <ul className="db-menu">
                      <li className="active">
                        <IconLayoutDashboard size={16} />
                        <span>Overview</span>
                      </li>
                      <li>
                        <IconTerminal2 size={16} />
                        <span>Console Logs</span>
                      </li>
                      <li>
                        <IconSettings size={16} />
                        <span>Settings</span>
                      </li>
                    </ul>
                  </div>

                  {/* Portal Status Section inside Sidebar */}
                  <div className="db-portal-status">
                    <div className="db-portal-header">Portal Gateway</div>
                    <div className={`status-badge-mini ${isAuthenticated ? 'connected' : 'restricted'}`}>
                      <span className="status-dot"></span>
                      <span>{isAuthenticated ? 'Connected' : 'Locked'}</span>
                    </div>

                    {isAuthenticated ? (
                      <div className="db-profile-mini">
                        <div>
                          <div className="profile-label">Challenger</div>
                          <div className="profile-val">{username}</div>
                        </div>
                        <div>
                          <div className="profile-label">Signature (UUID)</div>
                          <div className="profile-val">{userId}</div>
                        </div>
                        <div>
                          <div className="profile-label">Arena Clearance</div>
                          <div className="profile-val-role">{roles}</div>
                        </div>
                        {mode === 'mock' ? (
                          <button
                            className="btn-db-logout"
                            onClick={() => {
                              setMockState('guest');
                              setConsoleLogs('Session terminated.\nSwitched mock status back to Restricted Guest.');
                            }}
                          >
                            Disconnect
                          </button>
                        ) : (
                          <a href={getLogoutUrl()} className="btn-db-logout">
                            Disconnect
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="db-profile-mini">
                        <p className="locked-desc">
                          {mode === 'mock'
                            ? 'Greetings, traveler. You are currently in the simulation lobby.'
                            : 'Credentials required. Connect client to gateway authorization flow.'}
                        </p>
                        {mode === 'mock' ? (
                          <button
                            className="btn-db-login"
                            onClick={() => {
                              setMockState('user');
                              setConsoleLogs('Authenticated simulated subject: user@astrail.com\nClearance: ROLE_USER');
                            }}
                          >
                            Mock Login
                          </button>
                        ) : (
                          <a href={getOAuth2AuthorizeUrl()} className="btn-db-login">
                            Enter Portal
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </aside>

                {/* Dashboard Main Workspace */}
                <div className="db-main">
                  <header className="db-header">
                    <div className="db-title-group">
                      <h2>System Telemetry Dashboard</h2>
                      <p>
                        Arena Rank Clearance: <span className="text-gold">{mockState.toUpperCase()}</span>
                      </p>
                    </div>

                    {/* Mode Switcher */}
                    <div className="db-mode-switcher">
                      <button
                        className={`btn-db-mode ${mode === 'mock' ? 'active' : ''}`}
                        onClick={() => setMode('mock')}
                      >
                        Sandbox
                      </button>
                      <button
                        className={`btn-db-mode ${mode === 'live' ? 'active' : ''}`}
                        onClick={() => setMode('live')}
                      >
                        Live Connection
                      </button>
                    </div>
                  </header>

                  <div className="db-content-grid">
                    {/* Stat Card 1 */}
                    <div className="db-card">
                      <div>
                        <div className="stat-label">
                          <IconActivity size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          <span>Active Battles</span>
                        </div>
                        <div className="stat-number">
                          2,481 <span className="stat-unit">battles</span>
                        </div>
                      </div>
                      <div className="stat-graph-container">
                        <svg className="mini-chart" viewBox="0 0 100 30" fill="none">
                          <path d="M 0 25 C 20 5, 40 28, 60 12 C 80 20, 90 2, 100 8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="db-card">
                      <div>
                        <div className="stat-label">
                          <IconUsers size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          <span>Online Challengers</span>
                        </div>
                        <div className="stat-number">
                          {isAuthenticated ? (mockState === 'admin' ? 842 : 124) : 0}{' '}
                          <span className="stat-unit">nodes</span>
                        </div>
                      </div>
                      <div className="stat-graph-container">
                        <svg className="mini-chart" viewBox="0 0 100 30" fill="none">
                          <path d="M 0 20 C 15 20, 30 10, 45 25 C 60 12, 85 28, 100 15" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Simulation Clearance Elevation Controls */}
                    {mode === 'mock' && isAuthenticated && (
                      <div className="db-card span-cols-2">
                        <div className="stat-label">Arena Rank Clearance Controls (Sandbox)</div>
                        <div className="sim-selectors-db">
                          <button
                            className={`btn-sim-db ${mockState === 'user' ? 'active' : ''}`}
                            onClick={() =>
                              handleTest('/api/test/revoke-admin', 'Simulating: Revoking Administrative clearance...')
                            }
                          >
                            Revoke ADMIN Rank
                          </button>
                          <button
                            className={`btn-sim-db ${mockState === 'admin' ? 'active' : ''}`}
                            onClick={() =>
                              handleTest('/api/test/grant-admin', 'Simulating: Escalating clearance to ADMIN...')
                            }
                          >
                            Elevate ADMIN Rank
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Endpoint Gateway Action panel */}
                    <div className="db-card span-cols-2">
                      <div className="stat-label">Matchmaker Sectors</div>
                      <div className="endpoint-buttons">
                        <button
                          className="btn-endpoint"
                          onClick={() => handleTest('/api/test/public', 'Querying Public Orbit lobby [permitAll]...')}
                        >
                          Public Lobby
                        </button>
                        <button
                          className="btn-endpoint"
                          onClick={() =>
                            handleTest('/api/test/user', 'Querying Challenger Gate [hasRole(\'USER\')]...')
                          }
                        >
                          Challenger Gate
                        </button>
                        <button
                          className="btn-endpoint"
                          onClick={() =>
                            handleTest('/api/test/admin', 'Querying Fox Spirit Shrine [hasRole(\'ADMIN\')]...')
                          }
                        >
                          Fox Spirit Shrine
                        </button>
                      </div>
                    </div>

                    {/* Console terminal window inside Dashboard */}
                    <div className="db-card span-cols-2" style={{ padding: 0 }}>
                      <div className="terminal-console-db">
                        <div className="terminal-header-db">
                          <div className="terminal-dots-db">
                            <div className="dot dot-red"></div>
                            <div className="dot dot-yellow"></div>
                            <div className="dot dot-green"></div>
                          </div>
                          <div className="terminal-title-db">astrail-client-term.sh</div>
                          <span className="terminal-badge-db">READY</span>
                        </div>
                        <div className="terminal-body-db" id="consoleOutput">
                          {consoleLogs}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer link section */}
      <footer className="footer-credits">
        <div className="footer-container">
          <div className="footer-col-info">
            <div className="footer-logo-area">
              <img src="/logo.png" className="footer-logo" alt="ASTRAIL Logo" />
              <span className="footer-brand">ASTRAIL</span>
            </div>
            <p className="footer-tagline">
              Multiplayer quiz battle platform guided by celestial star trails and fox spirits.
            </p>
            <div className="footer-copyright">
              &copy; {new Date().getFullYear()} Astrail Systems Inc. All rights reserved.
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#architecture">Architecture</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
              <li><a href="#changelog">Changelog</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#api">API Reference</a></li>
              <li><a href="#community">Community</a></li>
              <li><a href="#status">Status</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
