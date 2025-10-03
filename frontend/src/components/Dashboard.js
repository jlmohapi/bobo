import React from 'react';

export default function Dashboard({ user }) {
  if (!user) return <div>Loading...</div>;

  return (
    <div className="card p-3">
      <h5>Welcome, {user.full_name} ({user.role})</h5>
      <p>This is your dashboard. Use the navigation to access features based on your role.</p>
      {user.role === 'lecturer' && <p>As a lecturer, you can submit reports and view your reports.</p>}
      {user.role === 'prl' && <p>As a PRL, you can view reports, add feedback, and manage courses.</p>}
      {user.role === 'pl' && <p>As a PL, you can manage courses and classes, view reports.</p>}
      {user.role === 'student' && <p>As a student, you can view reports and submit ratings.</p>}
      {user.role === 'admin' && <p>As an admin, you have full access.</p>}
    </div>
  );
}
