import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '#/login';
      return;
    }

    try {
      // Simple JWT decode (base64) for payload (assuming no verification needed for demo)
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (err) {
      localStorage.removeItem('token');
      window.location.href = '#/login';
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="page light">
        <div className="section container">
          <div className="card">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page light">
      <section className="section container">
        <div className="dashboard-header">
          <h1>Welcome back, {user.name || user.kind}!</h1>
          <p className="muted">Your dashboard for {user.kind === 'user' ? 'donor activities' : 'hospital management'}</p>
        </div>

        <div className="grid-2">
          {/* Profile Card */}
          <div className="card profile-card">
            <h3>Profile</h3>
            <div className="profile-info">
              {user.kind === 'user' ? (
                <>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Phone:</strong> {user.phone}</p>
                  <p><strong>Blood Type:</strong> {user.bloodType}</p>
                  <p><strong>Status:</strong> {user.availabilityStatus}</p>
                  {user.email && <p><strong>Email:</strong> {user.email}</p>}
                </>
              ) : (
                <>
                  <p><strong>Hospital:</strong> {user.name}</p>
                  <p><strong>License:</strong> {user.licenseNo}</p>
                  <p><strong>Type:</strong> {user.type}</p>
                  <p><strong>City:</strong> {user.address?.city}</p>
                </>
              )}
            </div>
            <button className="btn btn-outline">Edit Profile</button>
          </div>

          {/* Stats Card */}
          <div className="card stats-card">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Active Requests</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1</div>
                <div className="stat-label">My Donations</div>
              </div>
              {user.kind === 'hospital' && (
                <div className="stat-item">
                  <div className="stat-number">5</div>
                  <div className="stat-label">Inventory Items</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card actions-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            {user.kind === 'user' ? (
              <>
                <button className="btn btn-pill">Update Availability</button>
                <button className="btn btn-pill">View Matches</button>
                <button className="btn btn-outline">SOS Alert</button>
              </>
            ) : (
              <>
                <button className="btn btn-pill">Update Inventory</button>
                <button className="btn btn-pill">Request Donation</button>
                <button className="btn btn-outline">View Reports</button>
              </>
            )}
          </div>
        </div>

        <div className="card activity-card">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            <li>Logged in at 10:30 AM</li>
            <li>Updated availability to available</li>
            <li>Viewed donor matches</li>
            {user.kind === 'hospital' && <li>Added blood stock: O+ (2 units)</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
