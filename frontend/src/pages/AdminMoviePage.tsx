import { SetStateAction, useEffect, useState } from "react";
import { MoviesTitle } from "../types/Movie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import NewMovieForm from "./NewMovieForm";
import EditMovieForm from "../components/EditMovieForm";
import Pagination from "../components/Pagination";

const AdminMoviePage = () => {
  const [movies, setMovies] = useState<MoviesTitle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNum, setPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMovie, setEditingMovie] = useState<MoviesTitle | null>(null);

  const fetchMovies = async () => {
    try {
      const response = await fetch(
        `https://localhost:5000/MoviesTitle/AllMovies?pageSize=${pageSize}&pageNum=${pageNum}`
      );
      if (!response.ok) throw new Error("Failed to fetch movies");

      const data = await response.json();
      setMovies(data.movies ?? []);
      setTotalPages(Math.ceil(data.totalNumMovies / pageSize));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [pageSize, pageNum]);

  const handleDelete = async (showId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this movie?");
    if (!confirmDelete) return;

    try {
      await fetch(`https://localhost:5000/MoviesTitle/DeleteMovie/${showId}`, {
        method: "DELETE",
      });
      setMovies(movies.filter((m) => m.showId !== showId));
    } catch (error) {
      alert("Failed to delete movie.");
    }
  };

  if (loading) return <p>Loading Movies...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <div>
        <h1 className="mb-3">Admin - Movies</h1>
      <div className="add-container">
        <p>To view all fields, use the Edit button</p>

      <div className="gap">
        <input type="text" placeholder="Search for Title..." className="gap"/>

        {!showForm && (
          <button className="add-button-styles gap-left" onClick={() => setShowForm(true)} >
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
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingMovie(m)}
                />
              </td>
              <td>
                <FontAwesomeIcon
                  icon={faTrash}
                  className="text-danger"
                  style={{ cursor: "pointer" }}
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
          setPageNum(1);
        }}
      />
    </div>
  );
};

export default AdminMoviePage;
