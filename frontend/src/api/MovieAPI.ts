import { MoviesTitle } from "../types/Movie"; // adjust this import path if needed

interface FetchMoviesResponse {
  movies: MoviesTitle[];
  totalNumMovies: number;
}

const API_URL = 'https://localhost:5000';

// Fetch movies with optional category filters
export const fetchMovies = async (
  pageSize: number,
  pageNum: number,
  selectedCategories: string[]
): Promise<FetchMoviesResponse> => {
  try {
    const categoryParams = selectedCategories
      .map((cat) => `genres=${encodeURIComponent(cat)}`) // update param name if needed
      .join('&');

    const response = await fetch(
      `${API_URL}/MoviesTitle/AllMovies?pageSize=${pageSize}&pageNum=${pageNum}${
        selectedCategories.length > 0 ? `&${categoryParams}` : ''
      }`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch movies');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

// Add a new movie
export const addMovie = async (newMovie: MoviesTitle): Promise<MoviesTitle> => {
  try {
    const response = await fetch(`${API_URL}/MoviesTitle/AddMovie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMovie),
    });

    if (!response.ok) {
      throw new Error('Failed to add movie');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding movie:', error);
    throw error;
  }
};

// Update an existing movie
export const updateMovie = async (
  movieId: string,
  updatedMovie: MoviesTitle
): Promise<MoviesTitle> => {
  try {
    const response = await fetch(`${API_URL}/MoviesTitle/UpdateMovie/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedMovie),
    });

    if (!response.ok) {
      throw new Error('Failed to update movie');
    }

    // NoContent response (204) will not have a body to parse
    // Return the updatedMovie object that was sent
    return response.status === 204 ? updatedMovie : await response.json();
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

// Delete a movie by ID
export const deleteMovie = async (movieId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/MoviesTitle/DeleteMovie/${movieId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete movie');
    }
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};
