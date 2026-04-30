import { useState, useEffect } from 'react'
import './App.css'
import { ShellCard } from './components/ui'
import { useLifeOsApp } from './hooks/use-lifeos-app'
import { SECTION_META } from './lib/lifeos'
import type { SectionId } from './types/lifeos'
import {
  DashboardSection,
  FamilySection,
  HabitsSection,
  LearningSection,
  NotesSection,
  ProfileSection,
  ReadingSection,
  SkillsSection,
  WealthSection,
  WishesSection,
  WorkSection,
} from './features/sections'

const SyncBadge = ({
  status,
  kind,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
  kind: 'local' | 'firebase'
}) => (
  <span className={`status-pill status-pill--${status}`}>
    {kind === 'firebase' ? 'Cloud' : 'Local'}
  </span>
)

const AuthScreen = ({
  onAuth,
  onUseLocal,
  error,
  firebaseConfigured,
}: {
  onAuth: (intent: 'signin' | 'signup' | 'google', credentials?: { email: string; password: string }) => Promise<void>
  onUseLocal?: () => Promise<void>
  error: string | null
  firebaseConfigured: boolean
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="gate">
      <ShellCard>
        <p className="gate__eyebrow">LifeOS mobile</p>
        <h1>Welcome Back</h1>
        <p className="gate__copy">
          Sign in to access your personal operating system.
        </p>
        <div className="stack">
          <button className="button button--primary button--wide" onClick={() => onAuth('google')} type="button" style={{background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--border2)'}}>
            Continue with Google
          </button>
          
          <div style={{textAlign: 'center', color: 'var(--muted)', fontSize: '13px', margin: '8px 0'}}>or</div>

          <div className="stack">
            <input className="field" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input
              className="field"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="inline-fields" style={{marginTop: '8px'}}>
            <button className="button button--ghost" onClick={() => setMode('signin')} type="button" style={{flex: 1, opacity: mode === 'signin' ? 1 : 0.5}}>
              Sign in
            </button>
            <button className="button button--ghost" onClick={() => setMode('signup')} type="button" style={{flex: 1, opacity: mode === 'signup' ? 1 : 0.5}}>
              Create
            </button>
          </div>
          <button
            className="button button--primary button--wide"
            onClick={() => onAuth(mode, { email, password })}
            type="button"
          >
            {mode === 'signin' ? 'Sign In Securely' : 'Create Account'}
          </button>
          
          {error && <p className="error-banner">{error}</p>}
          {!firebaseConfigured && onUseLocal && (
            <button className="button button--ghost button--wide" onClick={onUseLocal} type="button" style={{marginTop: '16px'}}>
              Use Offline Mode
            </button>
          )}
        </div>
      </ShellCard>
    </div>
  )
}

const SetupScreen = ({
  onUseLocal,
}: {
  onUseLocal: () => Promise<void>
}) => (
  <div className="gate">
    <ShellCard>
      <p className="gate__eyebrow">Setup</p>
      <h1>Configure Keys</h1>
      <p className="gate__copy">
        Please add your Firebase keys to the .env file to enable cloud sync.
      </p>
      <button className="button button--primary button--wide" onClick={onUseLocal} type="button">
        Continue in local mode
      </button>
    </ShellCard>
  </div>
)

// Mobile Menu Component
const MenuSection = ({ 
  goTo, 
  signOut,
  email
}: { 
  goTo: (id: SectionId) => void
  signOut: () => void
  email?: string
}) => {
  const menuItems = SECTION_META.filter(s => !['dashboard', 'work', 'habits', 'wealth'].includes(s.id));
  
  return (
    <div className="stack">
      <div className="section-header">
        <p className="section-header__eyebrow">Menu</p>
        <h2>More Modules</h2>
      </div>
      
      <div className="stack" style={{gap: '8px'}}>
        {menuItems.map(item => (
          <button 
            key={item.id} 
            className="list-item section-row" 
            onClick={() => goTo(item.id)}
            style={{border: 'none', background: 'var(--surface)', padding: '16px 20px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)'}}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600}}>
              <span style={{fontSize: '20px'}}>{item.icon}</span>
              {item.label}
            </div>
            <span style={{color: 'var(--muted)'}}>→</span>
          </button>
        ))}
      </div>

      <div style={{marginTop: '32px'}}>
        <p style={{fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', paddingLeft: '8px'}}>
          Account: {email || 'Local Mode'}
        </p>
        <button className="button button--ghost button--wide" onClick={signOut} type="button" style={{color: 'var(--c-pink)', background: 'rgba(255, 92, 92, 0.1)'}}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

function App() {
  const {
    mode,
    data,
    user,
    error,
    syncStatus,
    repositoryKind,
    firebaseConfigured,
    loadLocalMode,
    authenticate,
    signOut,
    updateModule,
  } = useLifeOsApp()
  const [activeSection, setActiveSection] = useState<SectionId | 'menu'>('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('lifeos-theme') === 'dark'
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('lifeos-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('lifeos-theme', 'light')
    }
  }, [isDarkMode])

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection data={data} goTo={setActiveSection} />
      case 'work': return <WorkSection data={data.work} onChange={(value) => updateModule('work', value)} />
      case 'habits': return <HabitsSection data={data.habits} onChange={(value) => updateModule('habits', value)} />
      case 'wealth': return <WealthSection data={data.wealth} onChange={(value) => updateModule('wealth', value)} />
      case 'profile': return <ProfileSection data={data.profile} onChange={(value) => updateModule('profile', value)} />
      case 'skills': return <SkillsSection data={data.skills} onChange={(value) => updateModule('skills', value)} />
      case 'learning': return <LearningSection data={data.learning} onChange={(value) => updateModule('learning', value)} />
      case 'reading': return <ReadingSection data={data.reading} onChange={(value) => updateModule('reading', value)} />
      case 'notes': return <NotesSection data={data.notes} onChange={(value) => updateModule('notes', value)} />
      case 'family': return <FamilySection data={data.family} onChange={(value) => updateModule('family', value)} />
      case 'wishes': return <WishesSection data={data.wishes} onChange={(value) => updateModule('wishes', value)} />
      case 'menu': return <MenuSection goTo={setActiveSection} signOut={signOut} email={user?.email || undefined} />
      default: return null
    }
  }

  if (mode === 'local-setup') return <SetupScreen onUseLocal={loadLocalMode} />
  if (mode === 'auth') return <AuthScreen onAuth={authenticate} onUseLocal={!firebaseConfigured ? loadLocalMode : undefined} error={error} firebaseConfigured={firebaseConfigured} />
  if (mode === 'loading') return <div className="gate"><ShellCard><h1>Loading...</h1></ShellCard></div>

  // Mobile Bottom Nav items (Max 5)
  const navItems = [
    { id: 'dashboard', icon: '◈', label: 'Home' },
    { id: 'work', icon: '▣', label: 'Work' },
    { id: 'habits', icon: '◎', label: 'Habits' },
    { id: 'wealth', icon: '◉', label: 'Wealth' },
    { id: 'menu', icon: '☰', label: 'Menu' },
  ] as const;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar__eyebrow">LifeOS</p>
          <h1 style={{fontSize: '20px'}}>Command Centre</h1>
        </div>
        <div className="topbar__actions" style={{flexDirection: 'row', alignItems: 'center'}}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{background: 'transparent', fontSize: '20px', marginRight: '8px'}}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <SyncBadge status={syncStatus} kind={repositoryKind} />
        </div>
      </header>

      {error && <p className="error-banner" style={{margin: '0 20px'}}>{error}</p>}
      
      <main className="main-panel">
        {renderSection()}
      </main>

      <nav className="section-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`section-nav__button nav-tab-${item.id} ${item.id === activeSection ? 'section-nav__button--active' : ''}`}
            onClick={() => setActiveSection(item.id)}
            type="button"
            style={{flex: 1}}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
