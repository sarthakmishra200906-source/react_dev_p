import React from 'react';

export default function Carsoul() {
  return (
    <div 
      id="carouselExampleSlidesOnly" 
      className="carousel slide" 
      data-bs-ride="carousel"
      data-bs-interval="3000"
    >
      <div className="carousel-inner">
        {/* Removed data-bs-interval="3000" from individual items */}
        <div className="carousel-item active">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwrv6wL3j0nnG6xaohw79S9j1QQAeO67V5XBhlcaqUWA&s=10" 
            className="d-block w-100 img-fluid img-thumbnail" 
            style={{ objectFit: 'cover', maxHeight: '350px' }} 
            alt="Carousel slide 1"
          />
        </div>
        <div className="carousel-item">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOZH7f_We3h77nBSggwnLnWFywkoxsqEij8zkzgThWQg&s=10" 
            className="d-block w-100 img-fluid img-thumbnail" 
            style={{ objectFit: 'cover', maxHeight: '350px' }} 
            alt="Carousel slide 2"
          />
        </div>
        <div className="carousel-item">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR31PdNyCMMzYJ36nxUAluKqaR8bdKWLQv5se6FTuM85A&s=10" 
            className="d-block w-100 img-fluid img-thumbnail" 
            style={{ objectFit: 'cover', maxHeight: '350px' }} 
            alt="Carousel slide 3"
          />
        </div>
      </div>
    </div>
  );
}