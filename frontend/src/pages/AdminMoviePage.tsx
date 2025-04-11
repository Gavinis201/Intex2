import { SetStateAction, useEffect, useState } from 'react';
import { MoviesTitle } from '../types/Movie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminMoviePage.css';
import NewMovieForm from './NewMovieForm';
import EditMovieForm from '../components/EditMovieForm';
import Pagination from '../components/Pagination';

const AdminMoviePage = () => {
  const [movies, setMovies] = useState<MoviesTitle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNum, setPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMovie, setEditingMovie] = useState<MoviesTitle | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [adminTokenRefreshed, setAdminTokenRefreshed] = useState(false);

  // Add function to refresh admin token
  const refreshAdminToken = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      // Call login refresh endpoint to get a new token with admin claims
      const response = await fetch(
        `${import.meta.env.VITE_AUTH_API_URL}/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Update token in localStorage
          localStorage.setItem('authToken', data.token);
          console.log('Admin token refreshed successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error refreshing admin token:', error);
      return false;
    }
  };

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        `${import.meta.env.VITE_MOVIES_API_URL}/AllMovies?pageSize=${pageSize}&pageNum=${pageNum}&search=${encodeURIComponent(searchTerm)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) throw new Error('Failed to fetch movies');

      const data = await response.json();
      setMovies(data.movies ?? []);
      setTotalPages(Math.ceil(data.totalNumMovies / pageSize));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // First refresh the admin token when page loads
  useEffect(() => {
    const initializeAdminPage = async () => {
      setLoading(true);
      const refreshed = await refreshAdminToken();
      setAdminTokenRefreshed(refreshed);
      fetchMovies();
    };

    initializeAdminPage();
  }, []);

  // Fetch movies whenever page size, page number, or search changes
  useEffect(() => {
    if (adminTokenRefreshed) {
      fetchMovies();
    }
  }, [pageSize, pageNum, searchTerm, adminTokenRefreshed]);

  // Reset to first page when search term changes
  useEffect(() => {
    setPageNum(1);
  }, [searchTerm]);

  const handleDelete = async (showId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this movie?'
    );
    if (!confirmDelete) return;

    try {
      // Get the authentication token
      const token = localStorage.getItem('authToken');

      if (!token) {
        alert('You must be logged in to delete movies.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_MOVIES_API_URL}/DeleteMovie/${showId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting movie:', errorText);
        throw new Error('Failed to delete movie');
      }

      setMovies(movies.filter((m) => m.showId !== showId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete movie. Make sure you have admin privileges.');
    }
  };

  if (loading) return <p>Loading Movies...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <div className="container my-3 ">
      <h1 className="mb-3 text-white">Admin - Movies</h1>
      <div className="add-container text-white">
        <p>To view all fields, use the Edit button</p>

        <div className="gap">
          <input
            type="text"
            placeholder="Search for Title..."
            className="gaps"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {!showForm && (
            <button
              className="add-button-styles gap-left"
              onClick={() => setShowForm(true)}
            >
              Add Movie
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <NewMovieForm
          onSuccess={() => {
            setShowForm(false);
            fetchMovies();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingMovie && (
        <EditMovieForm
          movie={editingMovie}
          onSuccess={() => {
            setEditingMovie(null);
            fetchMovies();
          }}
          onCancel={() => setEditingMovie(null)}
        />
      )}

      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Director</th>
            <th>Type</th>
            <th>Year</th>
            <th>Duration</th>
            <th>Description</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((m) => (
            <tr key={m.showId}>
              <td>{m.showId}</td>
              <td>{m.title}</td>
              <td>{m.director}</td>
              <td>{m.type}</td>
              <td>{m.releaseYear}</td>
              <td>{m.duration}</td>
              <td>{m.description}</td>
              <td>
                <FontAwesomeIcon
                  icon={faEdit}
                  className="text-primary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setEditingMovie(m)}
                />
              </td>
              <td>
                <FontAwesomeIcon
                  icon={faTrash}
                  className="text-danger"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDelete(m.showId)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={pageNum}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPageNum}
        onPageSizeChange={(newSize: SetStateAction<number>) => {
          setPageSize(newSize);
          setPageNum(1); // Reset to page 1
        }}
      />
    </div>
  );
};

export default AdminMoviePage;
