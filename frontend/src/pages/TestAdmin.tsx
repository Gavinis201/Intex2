import React, { useEffect, useState } from 'react';
import {
  isAuthenticated,
  isAdmin,
  getUserId,
  getMoviesUserId,
} from '../services/authService';

const TestAdmin: React.FC = () => {
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [moviesUserId, setMoviesUserId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [adminResult, setAdminResult] = useState<any>(null);
  const [assigningAdmin, setAssigningAdmin] = useState<boolean>(false);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [refreshingToken, setRefreshingToken] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      setChecking(true);
      const isLoggedIn = isAuthenticated();
      setAuthenticated(isLoggedIn);

      const auth = localStorage.getItem('authToken');
      if (auth) {
        try {
          const base64Url = auth.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));

          setUserId(
            payload[
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier'
            ]
          );
          setMoviesUserId(payload['MoviesUserId']);

          const admin = await isAdmin();
          setAdminStatus(admin);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      setChecking(false);
    };

    checkAuth();
  }, []);

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const admin = await isAdmin();
      setAdminStatus(admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAdminCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setAdminResult(null);
      const response = await fetch(
        `https://localhost:5000/api/Auth/manual-admin-check?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      setAdminResult(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminResult({ error: 'Failed to check admin status' });
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setAssigningAdmin(true);
      setAssignResult(null);

      const response = await fetch(
        `https://localhost:5000/api/Auth/assign-admin-role?email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();
      setAssignResult(data);

      if (response.ok && data.token) {
        const currentEmail = localStorage.getItem('userEmail');
        if (currentEmail === email) {
          localStorage.setItem('authToken', data.token);
          handleRecheck();
        }
      }
    } catch (error) {
      console.error('Error assigning admin role:', error);
      setAssignResult({ error: 'Failed to assign admin role' });
    } finally {
      setAssigningAdmin(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setRefreshingToken(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in to refresh your token.');
        setRefreshingToken(false);
        return;
      }

      const response = await fetch(
        'https://localhost:5000/api/Auth/refresh-token',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          alert(
            'Token refreshed successfully. Your admin privileges should now work.'
          );
          handleRecheck();
        } else {
          alert('Failed to refresh token: No token returned');
        }
      } else {
        alert('Failed to refresh token: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      alert(
        'Error refreshing token: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setRefreshingToken(false);
    }
  };

  return (
    <div className="container mt-4">
      <h1>Admin Test Page</h1>

      <div className="card mb-4">
        <div className="card-header">
          <h2>Your Authentication Status</h2>
        </div>
        <div className="card-body">
          {checking ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Checking authentication status...</p>
            </div>
          ) : (
            <>
              <p>
                <strong>Authenticated:</strong> {authenticated ? 'Yes' : 'No'}
              </p>
              {authenticated && (
                <>
                  <p>
                    <strong>User ID:</strong> {userId}
                  </p>
                  <p>
                    <strong>Movies User ID:</strong> {moviesUserId}
                  </p>
                  <p>
                    <strong>Admin Status:</strong>{' '}
                    {adminStatus === null
                      ? 'Checking...'
                      : adminStatus
                        ? 'Yes'
                        : 'No'}
                  </p>

                  <div className="mt-3">
                    <button
                      className="btn btn-primary me-2"
                      onClick={handleRecheck}
                      disabled={checking}
                    >
                      {checking ? 'Checking...' : 'Re-check Admin Status'}
                    </button>

                    <button
                      className="btn btn-warning"
                      onClick={handleRefreshToken}
                      disabled={refreshingToken}
                    >
                      {refreshingToken
                        ? 'Refreshing...'
                        : 'Refresh Admin Token'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2>Check Admin Status</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleAdminCheck}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Check Admin Status
            </button>
          </form>

          {adminResult && (
            <div className="mt-3">
              <h3>Result:</h3>
              <pre className="bg-light p-3">
                {JSON.stringify(adminResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2>Assign Admin Role</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleAssignAdmin}>
            <div className="mb-3">
              <label htmlFor="adminEmail" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="adminEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={assigningAdmin}
            >
              {assigningAdmin ? 'Assigning...' : 'Assign Admin Role'}
            </button>
          </form>

          {assignResult && (
            <div className="mt-3">
              <h3>Result:</h3>
              <pre className="bg-light p-3">
                {JSON.stringify(assignResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestAdmin;
