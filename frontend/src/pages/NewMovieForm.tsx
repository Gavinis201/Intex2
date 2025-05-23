import { useState } from 'react';
import { MoviesTitle } from '../types/Movie';

interface NewMovieFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NewMovieForm: React.FC<NewMovieFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Partial<MoviesTitle>>({
    title: '',
    director: '',
    type: '',
    releaseYear: new Date().getFullYear(),
    duration: '',
    description: '',
    showId: crypto.randomUUID(), // or use something else for now
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add confirmation dialog
    const confirmAdd = window.confirm(
      'Are you sure you want to add this movie?'
    );
    if (!confirmAdd) return;

    setSubmitting(true);

    try {
      // Get the authentication token
      const token = localStorage.getItem('authToken');

      if (!token) {
        alert('You must be logged in to add movies.');
        setSubmitting(false);
        return;
      }

      console.log(
        'Sending request with token:',
        token.substring(0, 20) + '...'
      );

      const response = await fetch(
        'https://localhost:5000/MoviesTitle/AddMovie',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error adding movie:', errorText);
        throw new Error('Failed to add movie');
      }

      onSuccess();
    } catch (error) {
      console.error('Add error:', error);
      alert('Error adding movie. Make sure you have admin privileges.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mb-3">
        <label className="form-label text-white">Title</label>
        <input
          name="title"
          className="form-control"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Director</label>
        <input
          name="director"
          className="form-control"
          value={formData.director}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Type</label>
        <input
          name="type"
          className="form-control"
          value={formData.type}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Release Year</label>
        <input
          type="number"
          name="releaseYear"
          className="form-control"
          value={formData.releaseYear}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Duration</label>
        <input
          name="duration"
          className="form-control"
          value={formData.duration}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Description</label>
        <textarea
          name="description"
          className="form-control"
          value={formData.description}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Movie'}
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

export default NewMovieForm;
