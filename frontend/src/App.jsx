import React, { useEffect, useMemo, useRef, useState } from 'react'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function useCountUp(target, durationMs = 1500) {
  const [value, setValue] = useState(0)
  const startTs = useRef(null)
  useEffect(() => {
    let raf
    const step = (ts) => {
      if (!startTs.current) startTs.current = ts
      const p = Math.min(1, (ts - startTs.current) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.floor(target * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

function Stat({ end, suffix = '+', label }) {
  const val = useCountUp(end)
  const formatted = useMemo(() => val.toLocaleString(), [val])
  return (
    <div className="card stat-card reveal-on-scroll">
      <div className="stat-value">{formatted}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card feature-card reveal-on-scroll">
      <div className="feature-icon svg-wrap" dangerouslySetInnerHTML={{ __html: icon }} />
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  )
}

function useHashRoute() {
  const [route, setRoute] = useState(() => {
    const h = window.location.hash || ''
    return h.startsWith('#/') ? h.slice(2) : ''
  })
  useEffect(() => {
    const onChange = () => {
      const h = window.location.hash || ''
      setRoute(h.startsWith('#/') ? h.slice(2) : '')
    }
    window.addEventListener('hashchange', onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      window.removeEventListener('hashchange', onChange)
      window.removeEventListener('popstate', onChange)
    }
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal-on-scroll'))
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view')
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.15 })
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [route])

  const isLanding = route === '' || route === '/' || !route

  return (
    <div className="page light">
      <header className="navbar">
        <div className="nav-left">
          <a className="brand" href="#/">
            <div className="logo">
              <svg width="28" height="28" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff4d6d"/>
                    <stop offset="100%" stopColor="#ef233c"/>
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#g1)" />
                <path fill="#fff" d="M15 26h4l2-6 3 10 2-6h7" stroke="#fff" strokeWidth="2" fillOpacity="0"/>
              </svg>
            </div>
            <span>PulseLink</span>
          </a>
        </div>
        <div className="nav-center">
          <a className="nav-link active" href="#home">Home</a>
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#stats">Stats</a>
        </div>
        <div className="nav-right">
          <a className="btn btn-text" href="#/login">Login</a>
          <a className="btn btn-pill" href="#/signup">Sign up</a>
        </div>
      </header>

      <main>
        {isLanding && (
          <>
            <section id="home" className="hero light-hero reveal-on-scroll in-view">
              <div className="container">
                <h1>PulseLink — Community Blood & Organ Donation Network</h1>
                <p className="lead">Real-time matching of donors, hospitals, and blood banks using agentic AI. We verify compatibility, location, and urgency, monitor live inventory, and trigger SOS outreach with optimal routes — autonomously.</p>
                <div className="hero-cta">
                  <a className="btn btn-pill btn-hover" href="#/signup">Get started</a>
                  <a className="btn btn-outline btn-hover" href="#/login">Login</a>
                </div>
                <div className="hero-glass glass"></div>
                <div className="stats-row">
                  <Stat end={12450} label="Registered donors" />
                  <Stat end={320} label="Hospitals onboarded" />
                  <Stat end={25900} label="Lives impacted" />
                </div>
              </div>
            </section>

            <section id="features" className="section container reveal-on-scroll">
              <div className="feature-grid">
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M3 12h4l2-6 3 10 2-6h7" stroke="#ef233c" stroke-width="2" fill="none"/></svg>'
                  title="AI Donor Matching"
                  desc="Analyzes blood type, HLA/organ compatibility, distance, and urgency in real-time to match donors and recipients."
                />
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M4 5h16v4H4zM4 11h16v8H4zM9 13h6v4H9z" fill="#ef233c"/></svg>'
                  title="Live Inventory"
                  desc="Hospitals and blood banks publish current stock levels. AI identifies shortages and predicts future gaps."
                />
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M12 3l4 7H8l4-7zm0 18l-4-7h8l-4 7z" fill="#ef233c"/></svg>'
                  title="Emergency SOS"
                  desc="Instantly alerts nearby compatible donors and suggests the fastest routes to hospitals using live traffic."
                />
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M12 6V4l-2 2-2-2v2H6l2 2-2 2h2v2l2-2 2 2v-2h2l-2-2 2-2h-2z" fill="#ef233c"/></svg>'
                  title="Agentic Automation"
                  desc="Autonomously initiates outreach, coordinates logistics, and monitors outcomes without manual intervention."
                />
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v6h5" stroke="#ef233c" stroke-width="2" fill="none"/></svg>'
                  title="Smart Routing"
                  desc="Optimizes donor and courier logistics, ensuring rapid, reliable deliveries when every minute matters."
                />
                <Feature
                  icon='<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="white"/><path d="M12 21s-8-4.5-8-11a8 8 0 1 1 16 0c0 6.5-8 11-8 11zm0-13a2 2 0 1 0 .001 4.001A2 2 0 0 0 12 8z" fill="#ef233c"/></svg>'
                  title="Privacy & Safety"
                  desc="Verified donors and hospitals with secure, privacy-first data handling and audit trails."
                />
              </div>
            </section>

            <section id="how" className="section container how reveal-on-scroll">
              <h2>How PulseLink Works</h2>
              <div className="steps">
                <div className="step card"><span className="badge">1</span><h4>Sign up</h4><p>Donors and hospitals create verified profiles.</p></div>
                <div className="step card"><span className="badge">2</span><h4>Publish</h4><p>Hospitals update live inventory and needs.</p></div>
                <div className="step card"><span className="badge">3</span><h4>Match</h4><p>AI matches donors by compatibility, distance, urgency.</p></div>
                <div className="step card"><span className="badge">4</span><h4>Route</h4><p>SOS alerts and optimized routing speed up logistics.</p></div>
              </div>
              <div className="trust">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#ef233c" strokeWidth="2"/><path d="M7 12l3 3 7-7" stroke="#ef233c" strokeWidth="2"/></svg>
                <span>HIPAA-inspired privacy • Role-based access • Full audit logs</span>
              </div>
            </section>
          </>
        )}

        {route === 'login' && <Login />}
        {route === 'signup' && <Signup />}
      </main>

      <footer className="footer footer-red">
        <div className="container footer-grid">
          <div className="brand foot-brand">
            <div className="logo">
              <svg width="26" height="26" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff6b81"/>
                    <stop offset="100%" stopColor="#ef233c"/>
                  </linearGradient>
                </defs>
                <path d="M33.6 6.8c-3.4 0-6.3 2-9.6 6.2-3.3-4.2-6.2-6.2-9.6-6.2C8.3 6.8 4 11 4 16.8c0 10.6 10.2 16.5 19.2 23.9.5.4 1.2.4 1.7 0C33.9 33.3 44 27.4 44 16.8 44 11 39.7 6.8 33.6 6.8z" fill="url(#g2)"/>
              </svg>
            </div>
            <span>PulseLink</span>
          </div>
          <div className="foot-copy">© {new Date().getFullYear()} PulseLink • Community donation network</div>
          <div className="foot-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#stats">Stats</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
