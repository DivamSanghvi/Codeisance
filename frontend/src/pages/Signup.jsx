import React, { useState } from 'react'

const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const organs = ['Kidney','Liver','Heart','Lungs','Pancreas','Cornea','Bone Marrow','Other']

export default function Signup() {
  const [tab, setTab] = useState('donor')

  const submit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())
    body.organDonation = fd.getAll('organDonation')
    console.log('Signup submit', tab, body)
    alert('Signup form submitted (UI only).')
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
              <p className="muted small">Provide at least one credential: password or PIN</p>
            </div>

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
                <label htmlFor="email">Email (optional)</label>
                <input id="email" name="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="field">
                <label htmlFor="password">Password (optional)</label>
                <input id="password" name="password" type="password" placeholder="Create a password" />
              </div>
              <div className="field">
                <label htmlFor="pin">PIN (optional)</label>
                <input id="pin" name="pin" type="number" min="1000" max="999999" placeholder="4-6 digit PIN" />
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
              <button className="btn btn-pill" type="submit">Create account</button>
              <a className="btn btn-text" href="#/login">Already have an account?</a>
            </div>
          </form>
        )}

        {tab === 'hospital' && (
          <form className="card form-card" onSubmit={submit}>
            <div className="form-head">
              <h3>Hospital Sign up</h3>
            </div>

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
              <button className="btn btn-pill" type="submit">Create account</button>
              <a className="btn btn-text" href="#/login">Already registered?</a>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
