import React, { useState, useEffect, useRef } from 'react';

export default function Carsoul() {
  // Infinite forward track: Slide 1 -> Slide 2 -> Slide 1 (clone)
  // This guarantees it always moves forward (1 -> 2 -> 1 -> 2) without ever rewinding backwards
  const slides = [
    { src: '/hero_slide_1.jpg', alt: 'AI Study & Knowledge Flow' },
    { src: '/hero_slide_2.jpg', alt: 'Multi-Modal Research & Flashcards' },
    { src: '/hero_slide_1.jpg', alt: 'AI Study & Knowledge Flow Loop' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3200); // Cycles every 3.2 seconds smoothly

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTransitionEnd = () => {
    // When we reach index 2 (the clone of slide 1), snap back to index 0 with no backwards animation
    if (currentIndex === 2) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div
      id="carouselExampleSlidesOnly"
      className="carousel slide overflow-hidden rounded-3xl shadow-2xl position-relative w-100"
      style={{ minHeight: '320px', maxHeight: '440px', backgroundColor: '#0b0f19' }}
    >
      <div className="carousel-inner overflow-hidden w-100 h-100" style={{ minHeight: '320px', maxHeight: '440px' }}>
        {/* Continuous Horizontal Track: All slides are display:block so neither image is ever black or missing */}
        <div
          className="d-flex w-100 h-100"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitioning ? 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          }}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="carousel-item active w-100 flex-shrink-0"
              style={{
                display: 'block',
                minHeight: '320px',
                maxHeight: '440px',
              }}
            >
              <img
                src={slide.src}
                className="d-block w-100"
                style={{
                  height: '420px',
                  minHeight: '320px',
                  maxHeight: '440px',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#0f172a'
                }}
                alt={slide.alt}
                onError={(e) => {
                  // Fallback in case path resolution fails
                  if (!e.target.src.endsWith(slide.src)) {
                    e.target.src = slide.src;
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}