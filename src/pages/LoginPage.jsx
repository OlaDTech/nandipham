import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { clientSignIn, supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Icons } from '../components/Icons'
import ClientRegistration from '../components/ClientRegistration'

const heroImage = 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1800&q=82'

const trustStrip = [
  { Icon: Icons.warehouse, label: 'Guangzhou warehouse receiving' },
  { Icon: Icons.scan, label: 'Goods inspection' },
  { Icon: Icons.ship, label: 'Sea and air shipping' },
  { Icon: Icons.chart, label: 'Client portal tracking' },
]

const portalFeatures = [
  'Download and share your shipping mark.',
  'View goods received at the China warehouse.',
  'Follow sea and air shipment updates.',
  'Review receipts and prepaid balance.',
  'Submit and manage RMB purchase requests.',
  'Message the NandiphaM team.',
]

const processSteps = [
  ['01', 'Get your shipping mark', 'Create or receive your unique NandiphaM customer mark.'],
  ['02', 'Send it to your supplier', 'Your supplier places the mark on every package sent to our Guangzhou warehouse.'],
  ['03', 'We receive and inspect the goods', 'The team records the package details and adds available photos, weight and measurements.'],
  ['04', 'Your cargo is shipped', 'Goods are consolidated for sea or air shipment to Botswana.'],
  ['05', 'Follow every update', 'Track packages, receipts and shipment progress through the client portal.'],
]

const services = [
  { Icon: Icons.ship, title: 'Sea freight', text: 'For consolidated cartons and larger cargo moving from China to Botswana.', note: 'Contact us for the current rate.' },
  { Icon: Icons.plane, title: 'Air freight', text: 'For urgent goods that need faster dispatch in clearly managed air batches.', note: 'Contact us for the current rate.' },
  { Icon: Icons.receipt, title: 'RMB supplier payments', text: 'Request a product purchase quote and pay confirmed RMB charges from your prepaid wallet.', note: 'Quotes are confirmed before buying.' },
  { Icon: Icons.scan, title: 'Goods inspection', text: 'Warehouse staff record package details, available photos, weight and measurements.', note: 'Updates appear in the portal.' },
  { Icon: Icons.store, title: 'Supplier verification', text: 'Ask the team to review supplier details before you commit to an order.', note: 'Handled through the NandiphaM team.' },
  { Icon: Icons.box, title: 'China purchase assistance', text: 'Send 1688, Taobao or Pinduoduo links with variants and quantities for review.', note: 'RMB total is confirmed first.' },
]

const operationalImages = []

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="public-section-heading">
      {eyebrow && <div className="public-eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

export default function LoginPage() {
  const { signInStaff, signInClient } = useAuth()
  const initialRole = window.location.hash === '#/admin-login' ? 'admin' : window.location.hash === '#/staff-login' ? 'staff' : window.location.hash === '#/client-login' ? 'client' : null
  const [view, setView] = useState(initialRole ? 'login' : 'home')
  const [mode, setMode] = useState(initialRole === 'admin' || initialRole === 'staff' ? 'staff' : 'client')
  const [loginRole, setLoginRole] = useState(initialRole || 'client')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const openLogin = (role = 'client') => {
    setLoginRole(role)
    setMode(role === 'client' ? 'client' : 'staff')
    setError('')
    setMenuOpen(false)
    window.location.hash = `/${role}-login`
    setView('login')
  }

  const scrollBehavior = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

  const goHome = () => {
    window.history.replaceState(null, '', '/')
    setView('home')
    setError('')
    setMenuOpen(false)
  }

  const scrollToSection = id => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
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

  if (view === 'home') {
    const navItems = [
      ['Services', 'services'],
      ['How It Works', 'how-it-works'],
      ['Client Portal', 'client-portal'],
      ['Contact', 'contact'],
    ]

    return (
      <main className="public-site">
        <nav className="public-nav" aria-label="Public navigation">
          <button className="public-brand" onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })} aria-label="NandiphaM home">
            <img src="/nandipham-logo.svg" alt="NandiphaM" />
          </button>
          <button className="public-menu-button" type="button" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-controls="public-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <Icons.x size={20} /> : <Icons.grid size={20} />}
          </button>
          <div id="public-menu" className={`public-nav-actions ${menuOpen ? 'is-open' : ''}`}>
            {navItems.map(([label, id]) => (
              <button key={id} type="button" className="public-link" onClick={() => scrollToSection(id)}>{label}</button>
            ))}
            <button onClick={() => openLogin('client')} className="public-nav-cta">Client Login</button>
            <button onClick={() => setView('register')} className="public-nav-cta">Create account</button>
          </div>
        </nav>

        <section className="public-hero">
          <div className="public-hero-copy">
            <div className="public-eyebrow">CHINA TO BOTSWANA SHIPPING</div>
            <h1>From a little find.<br/>To a <em>big possibility.</em></h1>
            <p>Your connection from China to Botswana. Source something special, follow its journey, and keep every detail in one personal space.</p>
            <div className="public-hero-actions">
              <button className="btn btn-primary" onClick={() => setView('register')}>Start your journey</button>
              <button className="btn btn-secondary" onClick={() => openLogin('client')}>Track Your Goods</button>
            </div>
            <button className="public-signin-link" type="button" onClick={() => openLogin('client')}>Already a client? Sign in</button>
          </div>
          <div className="nm-hero-display" aria-label="China to Botswana, with NandiphaM">
            <span className="nm-eyebrow">A WORLD OF FINDS. ONE PERSONAL CONNECTION.</span>
            <div className="nm-parcel"><span className="nm-parcel-ribbon"/><div className="nm-parcel-sticker"><img src="/nandipham-logo.svg" alt="NandiphaM"/><span>CHINA → BOTSWANA</span><strong>Handled with care.</strong></div></div>
            <div className="nm-route-card"><span>01 / SOURCE IN CHINA</span><span>02 / FOLLOW YOUR CARGO</span><span>03 / RECEIVE IN BOTSWANA</span></div>
          </div>
        </section>

        <section className="public-trust-strip" aria-label="NandiphaM services">
          {trustStrip.map(item => <div key={item.label}><item.Icon size={18} /><span>{item.label}</span></div>)}
        </section>

        <section id="client-portal" className="public-section public-portal">
          <div className="portal-preview" aria-label="Demonstration client portal preview">
            <div className="portal-browser">
              <div className="portal-browser-top"><span /><span /><span /><strong>Demo portal view</strong></div>
              <div className="portal-browser-body">
                <div className="portal-demo-header"><span>Client account</span><strong>DEMO-MARK</strong></div>
                <div className="portal-demo-progress"><b>Warehouse</b><i /><b>In transit</b><i /><b>Delivered</b></div>
                <div className="portal-demo-grid">
                  <span><Icons.box size={17} />Goods received</span>
                  <span><Icons.receipt size={17} />Receipts</span>
                  <span><Icons.chart size={17} />Prepaid balance</span>
                  <span><Icons.chat size={17} />Messages</span>
                </div>
                <small>Demonstration data only</small>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Client portal" title="Everything about your shipment in one account." />
            <ul className="portal-feature-list">
              {portalFeatures.map(feature => <li key={feature}><Icons.check size={17} />{feature}</li>)}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="public-section public-process">
          <SectionHeading eyebrow="How it works" title="A clear path from supplier to delivery." />
          <ol>
            {processSteps.map(([step, title, text]) => <li key={step} data-step={step}><strong>{title}</strong><span>{text}</span></li>)}
          </ol>
        </section>

        <section id="services" className="public-section">
          <SectionHeading eyebrow="Services" title="Practical China logistics support for Botswana importers." text="Use the client portal for shipment updates, receipts, purchase requests and messages from the NandiphaM team." />
          <div className="service-grid">
            {services.map(service => (
              <article key={service.title}>
                <span className="service-icon"><service.Icon size={23} /></span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <small>{service.note}</small>
              </article>
            ))}
          </div>
        </section>

        {operationalImages.length > 0 && (
          <section className="public-section public-gallery">
            <SectionHeading eyebrow="Operations" title="NandiphaM work in progress." />
            <div className="public-gallery-grid">
              {operationalImages.map(image => (
                <figure key={image.src}><img src={image.src} alt={image.alt} /><figcaption>{image.caption}</figcaption></figure>
              ))}
            </div>
          </section>
        )}

        <section id="contact" className="public-cta">
          <div>
            <h2>Ready to start shipping from China?</h2>
            <p>Get your NandiphaM shipping mark and send our Guangzhou receiving details to your supplier.</p>
          </div>
          <div className="public-cta-actions">
            <button className="btn btn-primary" onClick={() => openLogin('client')}>Get Started</button>
            <button className="btn btn-secondary" onClick={() => openLogin('client')}>Contact NandiphaM</button>
          </div>
        </section>

        <footer className="public-footer">
          <div className="public-footer-brand">
            <img src="/nandipham-logo.svg" alt="NandiphaM" />
            <p>China to Botswana freight support with shipping marks, warehouse receiving, shipment updates, receipts and purchase requests in one secure portal.</p>
          </div>
          <div>
            <strong>Services</strong>
            <span>Sea freight</span>
            <span>Air freight</span>
            <span>RMB purchase assistance</span>
          </div>
          <div>
            <strong>Client Portal</strong>
            <button type="button" onClick={() => openLogin('client')}>Sign in</button>
            <button type="button" onClick={() => openLogin('client')}>Get your shipping mark</button>
          </div>
          <div>
            <strong>Contact</strong>
            <span>Use your existing NandiphaM contact for rates and account setup.</span>
            <span>Clients can sign in to message the team.</span>
            <figure className="nm-owner">
              <img src="/owner.jpg" alt="Owner of NandiphaM" width="1279" height="1914" loading="lazy" decoding="async" />
              <figcaption>Owner of NandiphaM</figcaption>
            </figure>
          </div>
          <small>Copyright {new Date().getFullYear()} NandiphaM Logistics. All rights reserved.</small>
        </footer>
      </main>
    )
  }

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
