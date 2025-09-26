import React, { useState } from 'react'

const API_BASE = 'http://localhost:8000'
const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const organs = ['Kidney','Liver','Heart','Lungs','Pancreas','Cornea','Bone Marrow','Other']

export default function Signup() {
  const [tab, setTab] = useState('donor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())
    body.organDonation = fd.getAll('organDonation')

    let endpoint, payload
    if (tab === 'donor') {
      endpoint = '/api/users/web-register'
      payload = {
        name: body.name,
        phone: body.phone,
        email: body.email,
        password: body.password,
        age: parseInt(body.age),
        gender: body.gender,
        bloodType: body.bloodType,
        organDonation: body.organDonation,
        anomalies: body.anomalies,
        pincode: body.pincode
      }
    } else {
      endpoint = '/api/users/hospital/register'
      payload = {
        name: body.name,
        licenseNo: body.licenseNo,
        password: body.password,
        address: {
          line1: body['address.line1'],
          line2: body['address.line2'],
          city: body['address.city'],
          state: body['address.state'],
          pincode: body['address.pincode'],
          country: body['address.country']
        },
        contact: {
          phone: body['contact.phone'],
          email: body['contact.email']
        },
        type: body.type,
        services: body.services ? body.services.split(',').map(s => s.trim()) : []
      }
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        alert(`${tab} signup successful!`)
        window.location.href = '#/dashboard'
      } else {
        setError(data.message || 'Signup failed')
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
          <h2>Create your account</h2>
          <p className="muted">Sign up as donor/user or hospital</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab==='donor'?'active':''}`} onClick={() => setTab('donor')}>Donor</button>
          <button className={`tab-btn ${tab==='hospital'?'active':''}`} onClick={() => setTab('hospital')}>Hospital</button>
        </div>

        {tab === 'donor' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Donor Sign up</h3>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" type="text" placeholder="Your name" required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" placeholder="Phone number" required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Create a password" required />
              </div>
              <div className="field">
                <label htmlFor="age">Age</label>
                <input id="age" name="age" type="number" min="18" max="65" placeholder="18-65" required />
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" required>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="bloodType">Blood type</label>
                <select id="bloodType" name="bloodType" required>
                  <option value="">Select</option>
                  {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field span-2">
                <label>Organs willing to donate</label>
                <div className="chip-row">
                  {organs.map(o => (
                    <label key={o} className="chip">
                      <input type="checkbox" name="organDonation" value={o} /> {o}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field span-2">
                <label htmlFor="anomalies">Anomalies / medical notes (optional)</label>
                <textarea id="anomalies" name="anomalies" rows="3" placeholder="Any relevant conditions or notes"></textarea>
              </div>
              <div className="field">
                <label htmlFor="pincode">Pincode</label>
                <input id="pincode" name="pincode" type="text" placeholder="Area pincode" required />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-pill" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
              <a className="btn btn-text" href="#/login">Already have an account?</a>
            </div>
          </form>
        )}

        {tab === 'hospital' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Hospital Sign up</h3>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="hname">Hospital name</label>
                <input id="hname" name="name" type="text" placeholder="Name" required />
              </div>
              <div className="field">
                <label htmlFor="type">Type</label>
                <select id="type" name="type" defaultValue="HOSPITAL">
                  <option>HOSPITAL</option>
                  <option>BLOOD_BANK</option>
                  <option>CLINIC</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="licenseNo">License number</label>
                <input id="licenseNo" name="licenseNo" type="text" placeholder="License number" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Create a password" required />
              </div>
              <div className="field">
                <label htmlFor="hphone">Contact phone</label>
                <input id="hphone" name="contact.phone" type="tel" placeholder="Phone" />
              </div>
              <div className="field">
                <label htmlFor="hemail">Contact email</label>
                <input id="hemail" name="contact.email" type="email" placeholder="email@hospital.org" />
              </div>
              <div className="field span-2">
                <label htmlFor="line1">Address line 1</label>
                <input id="line1" name="address.line1" type="text" placeholder="Street, area" required />
              </div>
              <div className="field span-2">
                <label htmlFor="line2">Address line 2 (optional)</label>
                <input id="line2" name="address.line2" type="text" placeholder="Landmark" />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="address.city" type="text" placeholder="City" required />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <input id="state" name="address.state" type="text" placeholder="State" required />
              </div>
              <div className="field">
                <label htmlFor="hpincode">Pincode</label>
                <input id="hpincode" name="address.pincode" type="text" placeholder="Pincode" required />
              </div>
              <div className="field">
                <label htmlFor="country">Country</label>
                <input id="country" name="address.country" type="text" placeholder="Country" required />
              </div>
              <div className="field span-2">
                <label htmlFor="services">Services (comma separated)</label>
                <input id="services" name="services" type="text" placeholder="e.g. blood bank, trauma, dialysis" />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-pill" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
              <a className="btn btn-text" href="#/login">Already registered?</a>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
