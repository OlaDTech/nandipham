import { useRef } from 'react'
import '../styles/public-home.css'

// Add the owner's business email here when it is ready.
const CONTACT_EMAIL = ''

export default function PublicHome({ onGetStarted, onSignIn }) {
  const contactDialog = useRef(null)

  return (
    <main className="owner-home">
      <header className="owner-home-header">
        <a href="/" aria-label="Nandipha M home" className="owner-home-monogram">NM</a>
        <button type="button" onClick={onSignIn}>Client sign in <span aria-hidden="true">↗</span></button>
      </header>

      <section className="owner-home-hero" aria-labelledby="owner-home-title">
        <span className="owner-home-eyebrow">YOUR PERSONAL CONNECTION</span>
        <h1 id="owner-home-title">Nandipha <em>M</em></h1>
        <p className="owner-home-tagline">CHINA SOURCING &amp; SHIPPING</p>
        <div className="owner-home-photo-stage">
          <span className="owner-home-side owner-home-side-left" aria-hidden="true">SOURCED WITH CARE.</span>
          <figure className="owner-home-portrait">
            <img src="/owner.jpg" alt="Nandipha M, founder" width="1279" height="1914" fetchPriority="high" />
            <figcaption className="owner-home-route" aria-label="Sourcing in China, shipping to Botswana">
              <span className="owner-home-country"><img src="/flags/china.svg" alt="China flag" width="36" height="24" /><span><small>FROM</small><strong>China</strong></span></span>
              <span className="owner-home-route-line" aria-hidden="true"><span>✈</span></span>
              <span className="owner-home-country"><img src="/flags/botswana.svg" alt="Botswana flag" width="36" height="24" /><span><small>TO</small><strong>Botswana</strong></span></span>
            </figcaption>
          </figure>
          <span className="owner-home-side owner-home-side-right" aria-hidden="true">DELIVERED WITH PURPOSE.</span>
        </div>
        <div className="owner-home-actions">
          {CONTACT_EMAIL ? <a className="owner-home-contact" href={`mailto:${CONTACT_EMAIL}`}>Contact Us</a> :
            <button className="owner-home-contact" type="button" onClick={() => contactDialog.current.showModal()}>Contact Us</button>}
          <button className="owner-home-start" type="button" onClick={onGetStarted}>Get Started <span aria-hidden="true">→</span></button>
        </div>
        <p className="owner-home-note">Your next chapter starts with a simple step.<br />Create your account to begin.</p>
      </section>

      <footer className="owner-home-footer"><span>China to Botswana</span><span>© {new Date().getFullYear()} Nandipha M</span></footer>

      <dialog ref={contactDialog} className="owner-contact-dialog" aria-labelledby="owner-contact-title">
        <form method="dialog"><button className="owner-contact-close" aria-label="Close contact details">×</button></form>
        <p className="owner-home-tagline">LET’S CONNECT</p>
        <h2 id="owner-contact-title">Contact Us</h2>
        <p>Our contact email will be available here soon.</p>
        <p>Already a client? Sign in to message the team from your account.</p>
        <button className="owner-home-start" type="button" onClick={() => { contactDialog.current.close(); onSignIn() }}>Client sign in <span aria-hidden="true">→</span></button>
      </dialog>
    </main>
  )
}
