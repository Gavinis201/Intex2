import 'bootstrap/dist/css/bootstrap.min.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (newSize: number) => void;
  }
  
  const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
  }) => {
    const generatePageNumbers = () => {
      const pages: (number | string)[] = [];
      const visibleRange = 1; // how many numbers to show around current page
  
      if (totalPages <= 7) {
        // Small total pages, just show all
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1); // Always show first page
  
        if (currentPage > 3) pages.push("...");
  
        const start = Math.max(currentPage - visibleRange, 2);
        const end = Math.min(currentPage + visibleRange, totalPages - 1);
  
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
  
        if (currentPage < totalPages - 2) pages.push("...");
  
        pages.push(totalPages); // Always show last page
      }
  
      return pages;
    };
  
    const pageNumbers = generatePageNumbers();
  
    return (
      <>
      
      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
        <div>
          <label className="me-2">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="form-select d-inline-block w-auto"
          >
            {[5, 10, 15, 20, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
  
        <nav className='mb-4'>
          <ul className="pagination mb-0 flex-wrap">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                Previous
              </button>
            </li>
  
            {pageNumbers.map((page, index) =>
              typeof page === "number" ? (
                <li
                  key={index}
                  className={`page-item ${page === currentPage ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => onPageChange(page)}>
                    {page}
                  </button>
                </li>
              ) : (
                <li key={index} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )
            )}
  
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
      </>
    );
  };
  
  export default Pagination;
  