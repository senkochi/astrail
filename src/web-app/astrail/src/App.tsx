import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState<'mock' | 'live'>('mock')
  const [mockState, setMockState] = useState<'guest' | 'user' | 'admin'>('guest')
  const [consoleLogs, setConsoleLogs] = useState<string>(
    'Welcome to Astrail Auth Console.\nClick any sector button above to initiate telemetry...'
  )

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
      setConsoleLogs('Initializing Live connection to Astrail API (http://localhost:9000)...')
      fetch('http://localhost:9000/api/test/user', {
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
              `Authenticated User: ${data.username}\n` +
              `Assigned Roles    : ${(data.roles || []).join(', ')}`
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
            `Could not resolve Astrail Gateway server on http://localhost:9000.\n` +
            `Make sure your Spring Boot backend application is running.\n\n` +
            `Error: ${err.message}`
          )
        })
    } else {
      // Mock mode reset
      setLiveUser(null)
      setConsoleLogs('Switched to Simulation Sandbox.\nClick any button above to initiate local telemetry...')
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
            message: 'This is a public celestial beacon. Anyone can read this! (Simulated)',
            endpoint: '/api/test/public',
            timestamp: Date.now()
          }
        } else if (endpoint === '/api/test/user') {
          if (mockState === 'guest') {
            status = '401 Unauthorized'
            payload = {
              status: 'Error',
              message: 'Full authentication is required to access this resource.',
              path: '/api/test/user'
            }
          } else {
            payload = {
              status: 'Success',
              message: 'Welcome to the Standard User Orbit. (Simulated)',
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
              message: 'Access granted to the Forbidden Administrative Nebula! (Simulated)',
              endpoint: '/api/test/admin',
              username: 'admin@astrail.com',
              roles: ['ROLE_USER', 'ROLE_ADMIN'],
              timestamp: Date.now()
            }
          } else if (mockState === 'user') {
            status = '403 Forbidden'
            payload = {
              status: 'Error',
              message: 'Access Denied: Subject signature does not have administrative clearance.',
              path: '/api/test/admin'
            }
          } else {
            status = '401 Unauthorized'
            payload = {
              status: 'Error',
              message: 'Full authentication is required to access this resource.',
              path: '/api/test/admin'
            }
          }
        } else if (endpoint === '/api/test/grant-admin') {
          if (mockState === 'guest') {
            status = '400 Bad Request'
            payload = { status: 'Error', message: 'You must be logged in to grant roles.' }
          } else {
            setMockState('admin')
            payload = {
              status: 'Success',
              message: 'ROLE_ADMIN granted programmatically! Mock Session elevated.'
            }
          }
        } else if (endpoint === '/api/test/revoke-admin') {
          if (mockState === 'guest') {
            status = '400 Bad Request'
            payload = { status: 'Error', message: 'You must be logged in to revoke roles.' }
          } else {
            setMockState('user')
            payload = {
              status: 'Success',
              message: 'ROLE_ADMIN revoked programmatically! Mock Session returned to normal user.'
            }
          }
        }

        let output = `[Simulated Telemetry]\n`
        output += `Target URL : ${endpoint}\n`
        output += `Status Code: ${status}\n`
        output += `Duration   : ${duration} ms\n\n`
        output += `[Payload Response]\n`
        output += JSON.stringify(payload, null, 4)

        setConsoleLogs(output)
      }, 400)
    } else {
      // Live API call flow
      const url = `http://localhost:9000${endpoint}`
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

  // Determine current display info
  const isAuthenticated = mode === 'mock' ? mockState !== 'guest' : !!(liveUser && liveUser.authenticated)
  const username = mode === 'mock' ? (mockState === 'admin' ? 'admin@astrail.com' : 'user@astrail.com') : (liveUser?.username || '')
  const userId = mode === 'mock' ? '8c223c14-2cc3-4b92-b883-e18c5e0031ff' : (liveUser?.userId || '')
  const roles = mode === 'mock' ? (mockState === 'admin' ? 'ROLE_USER, ROLE_ADMIN' : 'ROLE_USER') : (liveUser?.roles || '')

  return (
    <>
      {/* Background celestial styling */}
      <div className="cosmic-bg">
        <div className="nebula-glow-1"></div>
        <div className="nebula-glow-2"></div>

        {/* Stars layer */}
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

      <div className="landing-container">
        
        {/* Brand Area */}
        <div className="brand-logo-area">
          <img src="/logo.png" className="logo-emblem" alt="ASTRAIL Logo" />
          <h1 className="logo-text">ASTRAIL</h1>
        </div>

        {/* Server Mode Switcher */}
        <div className="mode-switcher">
          <button 
            className={`btn-mode ${mode === 'mock' ? 'active' : ''}`}
            onClick={() => setMode('mock')}
          >
            Simulation Sandbox
          </button>
          <button 
            className={`btn-mode ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
          >
            Live Server Connection
          </button>
        </div>

        {/* Main Glassmorphism Panel */}
        <div className="glass-card">
          <svg className="card-wave-tr" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 8 Q 65 10 82 45 Q 95 70 92 100" stroke="#D4AF37" strokeWidth="0.75" fill="none" />
            <path d="M 20 0 Q 75 10 88 35 Q 100 55 100 80" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 2" fill="none" />
          </svg>
          <svg className="card-wave-bl" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 92 Q 35 90 18 55 Q 5 30 8 0" stroke="#D4AF37" strokeWidth="0.75" fill="none" />
            <path d="M 80 100 Q 25 90 12 65 Q 0 45 0 20" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 2" fill="none" />
          </svg>

          <div className="card-grid">
            
            {/* Left Column: Profile & Session Info */}
            <div className="portal-side">
              <h2 className="section-title">Portal Gateway</h2>

              {isAuthenticated ? (
                <>
                  <div className="status-badge status-connected">
                    <span className="status-dot"></span>
                    <span>Portal Connected</span>
                  </div>

                  <div className="profile-card">
                    <div className="profile-field">
                      <div className="field-label">Celestial Subject</div>
                      <div className="field-value">{username}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">Subject Signature (UUID)</div>
                      <div className="field-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{userId}</div>
                    </div>
                    <div className="profile-field">
                      <div className="field-label">Assigned Star Systems (Roles)</div>
                      <div>
                        <span className="field-value-role">{roles}</span>
                      </div>
                    </div>
                  </div>

                  {mode === 'mock' ? (
                    <>
                      {/* Simulation Session Controls */}
                      <div className="dev-controls">
                        <div className="dev-controls-title">Role Clearance Control (Simulation)</div>
                        <div className="sim-selectors">
                          <button 
                            className={`btn-sim ${mockState === 'user' ? 'active' : ''}`}
                            onClick={() => handleTest('/api/test/revoke-admin', 'Simulating: Revoking Administrative clearance...')}
                          >
                            Revoke ADMIN
                          </button>
                          <button 
                            className={`btn-sim ${mockState === 'admin' ? 'active' : ''}`}
                            onClick={() => handleTest('/api/test/grant-admin', 'Simulating: Escalating clearance to ADMIN...')}
                          >
                            Elevate to ADMIN
                          </button>
                        </div>
                      </div>

                      <button 
                        className="btn-portal btn-portal-logout"
                        onClick={() => {
                          setMockState('guest');
                          setConsoleLogs('Session terminated.\nSwitched mock status back to Restricted Guest.');
                        }}
                      >
                        Sever Connection
                      </button>
                    </>
                  ) : (
                    <a 
                      href="http://localhost:9000/logout" 
                      className="btn-portal btn-portal-logout"
                    >
                      Sever Connection
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className="status-badge status-restricted">
                    <span className="status-dot"></span>
                    <span>Portal Locked</span>
                  </div>

                  <div className="profile-card" style={{ borderColor: 'rgba(214, 175, 55, 0.15)' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {mode === 'mock' 
                        ? 'Greetings, traveler. You are currently in the simulation lobby. Adjust the state above or query endpoints to explore responses.'
                        : 'Credentials required. The outer React client is unauthenticated. Click below to redirect to the Astrail backend authorization flow.'
                      }
                    </p>
                  </div>

                  {mode === 'mock' ? (
                    <div className="dev-controls">
                      <div className="dev-controls-title">Authenticate Simulation Subject</div>
                      <div className="sim-selectors">
                        <button 
                          className="btn-sim active" 
                          onClick={() => {
                            setMockState('user');
                            setConsoleLogs('Authenticated simulated subject: user@astrail.com\nClearance: ROLE_USER');
                          }}
                          style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'var(--success)' }}
                        >
                          Login Mock User
                        </button>
                      </div>
                    </div>
                  ) : (
                    <a 
                      href="http://localhost:9000/login" 
                      className="btn-portal btn-portal-login"
                    >
                      Enter the Starry Sky
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Sandbox Console */}
            <div className="sandbox-side">
              <h2 className="section-title">Authorization Sandbox</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px', lineHeight: '1.5' }}>
                Query mock or live backend endpoints to test HTTP codes and responses under different access clearance checks.
              </p>

              <div className="sandbox-buttons">
                <button 
                  className="btn-test" 
                  onClick={() => handleTest('/api/test/public', 'Querying Public Beacon [permitAll]...')}
                >
                  Public Orbit
                </button>
                <button 
                  className="btn-test" 
                  onClick={() => handleTest('/api/test/user', 'Querying User Sector [hasRole(\'USER\')]...')}
                >
                  User Station
                </button>
                <button 
                  className="btn-test" 
                  onClick={() => handleTest('/api/test/admin', 'Querying Admin Sector [hasRole(\'ADMIN\')]...')}
                >
                  Admin Sector
                </button>
              </div>

              {/* Terminal View */}
              <div className="terminal-console">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                  <div className="terminal-title">astrail-client-term.sh</div>
                  <div></div>
                </div>
                <div className="terminal-body" id="consoleOutput">
                  {consoleLogs}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default App
