import { useState } from 'react';
import { MoviesTitle } from '../types/Movie';

interface EditMovieFormProps {
  movie: MoviesTitle;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditMovieForm: React.FC<EditMovieFormProps> = ({
  movie,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<MoviesTitle>>({ ...movie });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'releaseYear' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add confirmation dialog
    const confirmUpdate = window.confirm(
      'Are you sure you want to save changes to this movie?'
    );
    if (!confirmUpdate) return;

    const fullPayload = {
      ...formData,
      showId: movie.showId, // ensure it's always included
    };

    console.log(
      'Sending PUT request to:',
      `${import.meta.env.VITE_MOVIES_API_URL}/UpdateMovie/${movie.showId}`
    );
    console.log('Payload:', fullPayload);

    setSubmitting(true);

    try {
      // Get the authentication token
      const token = localStorage.getItem('authToken');

      if (!token) {
        alert('You must be logged in to edit movies.');
        setSubmitting(false);
        return;
      }

      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(
        `${import.meta.env.VITE_MOVIES_API_URL}/UpdateMovie/${movie.showId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(fullPayload),
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response body:', text);
        throw new Error('Failed to update movie');
      }

      onSuccess();
    } catch (error) {
      console.error('Error caught:', error);
      alert('Error updating movie. Make sure you have admin privileges.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h5>Edit Movie</h5>

      <div className="mb-3">
        <label className="form-label text-white">Title</label>
        <input
          name="title"
          className="form-control"
          value={formData.title || ''}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Director</label>
        <input
          name="director"
          className="form-control"
          value={formData.director || ''}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Type</label>
        <input
          name="type"
          className="form-control"
          value={formData.type || ''}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Release Year</label>
        <input
          type="number"
          name="releaseYear"
          className="form-control"
          value={formData.releaseYear || ''}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Duration</label>
        <input
          name="duration"
          className="form-control"
          value={formData.duration || ''}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Description</label>
        <textarea
          name="description"
          className="form-control"
          value={formData.description || ''}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditMovieForm;
