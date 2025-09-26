import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'

export default function Login() {
  const [tab, setTab] = useState('donor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const obj = Object.fromEntries(form.entries())

    let endpoint, body
    if (tab === 'donor') {
      endpoint = '/api/users/login/web'
      body = { email: obj.email, password: obj.password }
    } else {
      endpoint = '/api/users/hospital/login'
      body = { licenseNo: obj.licenseNo, password: obj.password }
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        alert(`${tab} login successful!`)
        // Redirect to dashboard or home
        window.location.href = '#/dashboard'
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
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
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="Enter email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Enter password" required />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-pill" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
              <a className="btn btn-text" href="#/signup">Create account</a>
            </div>
          </form>
        )}

        {tab === 'hospital' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Hospital Login</h3>
              <p className="muted small">Use your registered license number and password</p>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="licenseNo">License number</label>
                <input id="licenseNo" name="licenseNo" type="text" placeholder="e.g. GJ/HH/12345" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Enter password" required />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-pill" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
              <a className="btn btn-text" href="#/signup">Create account</a>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
