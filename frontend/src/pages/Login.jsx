import React, { useState } from 'react'

export default function Login() {
  const [tab, setTab] = useState('donor')
  const [donorMethod, setDonorMethod] = useState('pin')

  const submit = (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const obj = Object.fromEntries(form.entries())
    console.log('Login submit', tab, donorMethod, obj)
    alert('Login form submitted (UI only).')
  }

  return (
    <section className="section container auth-section">
      <div className="auth-wrap">
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p className="muted">Login as donor/user or hospital</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab==='donor'?'active':''}`} onClick={() => setTab('donor')}>Donor</button>
          <button className={`tab-btn ${tab==='hospital'?'active':''}`} onClick={() => setTab('hospital')}>Hospital</button>
        </div>

        {tab === 'donor' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Donor Login</h3>
              <div className="option-row">
                <label className={`chip ${donorMethod==='pin'?'chip-active':''}`}>
                  <input type="radio" name="method" value="pin" checked={donorMethod==='pin'} onChange={()=>setDonorMethod('pin')} />
                  Phone + PIN
                </label>
                <label className={`chip ${donorMethod==='password'?'chip-active':''}`}>
                  <input type="radio" name="method" value="password" checked={donorMethod==='password'} onChange={()=>setDonorMethod('password')} />
                  Email/Phone + Password
                </label>
              </div>
            </div>

            {donorMethod === 'pin' ? (
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" placeholder="Enter phone number" required />
                </div>
                <div className="field">
                  <label htmlFor="pin">PIN</label>
                  <input id="pin" name="pin" type="number" placeholder="4-6 digit PIN" min="1000" max="999999" required />
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="identifier">Email or Phone</label>
                  <input id="identifier" name="identifier" type="text" placeholder="Enter email or phone" required />
                </div>
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" placeholder="Enter password" required />
                </div>
              </div>
            )}

            <div className="action-row">
              <button className="btn btn-pill" type="submit">Login</button>
              <a className="btn btn-text" href="#/signup">Create account</a>
            </div>
          </form>
        )}

        {tab === 'hospital' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Hospital Login</h3>
              <p className="muted small">Use your registered license number and contact email</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="licenseNo">License number</label>
                <input id="licenseNo" name="licenseNo" type="text" placeholder="e.g. GJ/HH/12345" required />
              </div>
              <div className="field">
                <label htmlFor="email">Contact email</label>
                <input id="email" name="email" type="email" placeholder="name@hospital.org" required />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-pill" type="submit">Login</button>
              <a className="btn btn-text" href="#/signup">Create account</a>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
