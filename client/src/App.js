import { useState } from 'react';
import './App.css';

function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [combinedImage, setCombinedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample image URLs - replace with your actual images
  const images = [
    'http://images.devman.site/boberito_bondito.png',
    'http://images.devman.site/bombardino_crocodilo.png',
    'http://images.devman.site/bombini_guzini.png',
    'http://images.devman.site/brr_brr_patapim.png',
    'http://images.devman.site/gangster_footera.png',
    'http://images.devman.site/glordo.png',
    'http://images.devman.site/lirili_larilla.png',
    'http://images.devman.site/tralalero_tralala.png',
    'http://images.devman.site/tripi_tropi.png',
    'http://images.devman.site/tung_sahur.png',
  ];

  const handleImageClick = (index) => {
    if (selectedImages.includes(index)) {
      // Deselect if already selected
      setSelectedImages(selectedImages.filter(i => i !== index));
    } else if (selectedImages.length < 2) {
      // Select if less than 2 are already selected
      setSelectedImages([...selectedImages, index]);
    }
  };

  const handleCombine = async () => {
    if (selectedImages.length !== 2) {
      alert('Please select exactly 2 images to combine');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCombinedImage(null);
    
    try {
      const formData = new URLSearchParams();
      const getFileName = (url) => url.substring(url.lastIndexOf('/') + 1);
      formData.append('image1', getFileName(images[selectedImages[0]]));
      formData.append('image2', getFileName(images[selectedImages[1]]));
      
      const response = await fetch('http://localhost:8080/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCombinedImage(data.imageUrl);
    } catch (err) {
      console.error('Error combining images:', err);
      setError('Failed to combine images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Brain Rot Generator</h1>
      <div className="image-grid">
        {images.map((src, index) => (
          <div
            key={index}
            className={`image-container ${selectedImages.includes(index) ? 'selected' : ''}`}
            onClick={() => handleImageClick(index)}
          >
            <img src={src} alt="" />
            {selectedImages.includes(index) && (
              <div className="selection-indicator">
                {selectedImages.indexOf(index) + 1}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className="combine-button" 
        onClick={handleCombine} 
        disabled={selectedImages.length !== 2 || isLoading}
      >
        {isLoading ? 'Combining...' : 'Combine'}
      </button>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating brain rot...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isLoading && combinedImage && (
        <div className="result-container">
          <h2>Combined Result</h2>
          <img src={combinedImage} alt="Combined" className="result-image" />
        </div>
      )}
    </div>
  );
}

export default App;
