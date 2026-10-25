import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { clientSignIn, supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Icons } from '../components/Icons'
import ClientRegistration from '../components/ClientRegistration'
import PublicHome from '../components/PublicHome'

export default function LoginPage() {
  const { signInStaff, signInClient } = useAuth()
  const initialRole = window.location.pathname.replace(/\/+$/, '') === '/admin' || window.location.hash === '#/admin-login' ? 'admin' : window.location.hash === '#/staff-login' ? 'staff' : window.location.hash === '#/client-login' ? 'client' : null
  const [view, setView] = useState(initialRole ? 'login' : 'home')
  const [mode, setMode] = useState(initialRole === 'admin' || initialRole === 'staff' ? 'staff' : 'client')
  const [loginRole, setLoginRole] = useState(initialRole || 'client')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const openLogin = (role = 'client') => {
    setLoginRole(role)
    setMode(role === 'client' ? 'client' : 'staff')
    setError('')
    if (role === 'admin') window.history.replaceState(null, '', '/admin')
    else window.location.hash = `/${role}-login`
    setView('login')
  }

  const goHome = () => {
    window.history.replaceState(null, '', '/')
    setView('home')
    setError('')
  }

  const handleClientLogin = async () => {
    if (!identifier.trim()) { setError('Enter your phone number or shipping mark.'); return }
    if (!password.trim()) { setError('Enter your password.'); return }
    setLoading(true); setError('')
    try {
      const session = await clientSignIn(identifier.trim(), password)
      signInClient(session)
      toast.success(`Welcome back, ${session.client.full_name.split(' ')[0]}!`)
    } catch {
      setError('We could not sign you in. Check your phone or shipping mark and password, then try again.')
    } finally { setLoading(false) }
  }

  const handleStaffLogin = async () => {
    if (!email.trim()) { setError('Enter your work email address.'); return }
    if (!password.trim()) { setError('Enter your password.'); return }
    setLoading(true); setError('')
    try {
      const profile = await signInStaff(email.trim(), password)
      if (loginRole === 'admin' && profile?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('This account is not an administrator account.')
      }
      if (loginRole === 'staff' && !['staff', 'warehouse_manager'].includes(profile?.role)) {
        await supabase.auth.signOut()
        throw new Error('Please use the administrator login for this account.')
      }
      toast.success(`Welcome, ${profile?.full_name || 'User'}!`)
    } catch (e) {
      const message = e.message || ''
      if (e.code === 'email_not_confirmed' || message.toLowerCase().includes('email not confirmed')) {
        setError('Your email is not confirmed. Confirm it in Supabase Authentication before signing in.')
      } else if (e.code === 'invalid_credentials' || message.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid work email or password. Check the email and reset this user’s password in Supabase if needed.')
      } else {
        setError(message || 'Could not sign in. Check your connection and try again.')
      }
    } finally { setLoading(false) }
  }

  const showHelpMessage = () => {
    setError(mode === 'client'
      ? 'For login help, contact your NandiphaM account representative with your phone number or shipping mark.'
      : 'For team login help, ask an administrator to check your work account access.')
  }

  const onKey = (event, fn) => { if (event.key === 'Enter') fn() }

  if (view === 'register') return <ClientRegistration onBack={() => openLogin('client')} />

  if (view === 'home') return <PublicHome onGetStarted={() => setView('register')} onSignIn={() => openLogin('client')} />

  const heading = mode === 'client' ? 'Client portal' : loginRole === 'admin' ? 'Administrator login' : 'Staff login'
  const loginAction = mode === 'client' ? handleClientLogin : handleStaffLogin

  return (
    <main className="login-bg">
      <div className="login-shell">
        <section className="login-card" aria-labelledby="login-title">
          <button className="login-back" onClick={goHome}><Icons.back size={16} />Back to homepage</button>
          <img className="login-wordmark" src="/nandipham-logo.svg" alt="NandiphaM" />
          <div className="login-card-kicker">{mode === 'client' ? 'Shipment access' : 'Team workspace'}</div>
          <h1 id="login-title" className="login-heading">{heading}</h1>
          <p className="login-copy">{mode === 'client' ? 'Sign in with your phone number or shipping mark. This device can stay signed in for up to 90 days.' : 'Sign in with your assigned NandiphaM work email.'}</p>

          {mode === 'client' ? (
            <>
              <label className="input-label" htmlFor="client-identifier">Phone number or shipping mark</label>
              <input id="client-identifier" className="input-field" placeholder="e.g. 080... or MY-001-ABC" value={identifier} onChange={e => setIdentifier(e.target.value)} onKeyDown={e => onKey(e, handleClientLogin)} autoComplete="username" aria-invalid={!!error && !identifier.trim()} autoFocus />
            </>
          ) : (
            <>
              <label className="input-label" htmlFor="staff-email">Work email address</label>
              <input id="staff-email" className="input-field" type="email" placeholder="you@nandipham.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => onKey(e, handleStaffLogin)} autoComplete="email" aria-invalid={!!error && !email.trim()} autoFocus />
            </>
          )}

          <label className="input-label" htmlFor="login-password" style={{ marginTop: 14 }}>Password</label>
          <div className="password-field">
            <input id="login-password" className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => onKey(e, loginAction)} autoComplete="current-password" aria-invalid={!!error && !password.trim()} />
            <button type="button" onClick={() => setShowPassword(show => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>

          {error && <div className="banner banner-error login-error" role="alert">{error}</div>}
          <button className="btn btn-primary btn-full login-submit" onClick={loginAction} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          <button type="button" className="login-help-action" onClick={showHelpMessage}>Get login help</button>
          {mode === 'client' && <button type="button" className="login-help-action" onClick={() => setView('register')}>New customer? Create an account</button>}
        </section>

        <aside className="login-benefits" aria-label="NandiphaM portal benefits">
          <div className="login-benefits-card">
            <div className="public-eyebrow">Secure NandiphaM access</div>
            <h2>Track shipments without calling for every update.</h2>
            <ul>
              <li><Icons.tag size={17} />Shipping mark and warehouse details</li>
              <li><Icons.box size={17} />Goods recorded by the China warehouse</li>
              <li><Icons.receipt size={17} />Receipts and prepaid balance</li>
              <li><Icons.chat size={17} />Messages with the NandiphaM team</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
