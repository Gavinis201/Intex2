import { useState } from "react";
import { MoviesTitle } from "../types/Movie";

interface EditMovieFormProps {
  movie: MoviesTitle;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditMovieForm: React.FC<EditMovieFormProps> = ({ movie, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Partial<MoviesTitle>>({ ...movie });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "releaseYear" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add confirmation dialog
    const confirmUpdate = window.confirm("Are you sure you want to save changes to this movie?");
    if (!confirmUpdate) return;
  
    const fullPayload = {
      ...formData,
      showId: movie.showId, // ensure it's always included
    };
  
    console.log("Sending PUT request to:", `https://localhost:5000/MoviesTitle/UpdateMovie/${movie.showId}`);
    console.log("Payload:", fullPayload);
  
    try {
      const response = await fetch(
        `https://localhost:5000/MoviesTitle/UpdateMovie/${movie.showId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullPayload),
        }
      );
  
      console.log("Response status:", response.status);
  
      if (!response.ok) {
        const text = await response.text();
        console.error("Error response body:", text);
        throw new Error("Failed to update movie");
      }
  
      onSuccess();
    } catch (error) {
      console.error("Error caught:", error);
      alert("Error updating movie. Please try again.");
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
          value={formData.title || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Director</label>
        <input
          name="director"
          className="form-control"
          value={formData.director || ""}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Type</label>
        <input
          name="type"
          className="form-control"
          value={formData.type || ""}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Release Year</label>
        <input
          type="number"
          name="releaseYear"
          className="form-control"
          value={formData.releaseYear || ""}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Duration</label>
        <input
          name="duration"
          className="form-control"
          value={formData.duration || ""}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label text-white">Description</label>
        <textarea
          name="description"
          className="form-control"
          value={formData.description || ""}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditMovieForm;
