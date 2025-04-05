import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [combinedImage, setCombinedImage] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sample image URLs - replace with your actual images
  const images = [
    'boberito_bondito.png',
    'bombardino_crocodilo.png',
    'bombini_guzini.png',
    'brr_brr_patapim.png',
    'gangster_footera.png',
    'glordo.png',
    'lirili_larilla.png',
    'tralalero_tralala.png',
    'tripi_tropi.png',
    'tung_sahur.png',
  ];

  useEffect(() => {
    // Simulate a login check
    const checkLoginStatus = async () => {
      // Replace with actual login logic
      const token = localStorage.getItem('token');
      if(token) {
        try {
          const response = await axios.get(URL+"/me/status", {
            headers: {
              'Authorization': token,
            },
          });
          if (response.status === 200) {
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } catch(error) {
          console.log('Error checking login status:', error);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async (password) => {
    try {
      const response = await axios.post(URL+"/login", { password });
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        setIsLoggedIn(true);
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    }
  };

  const handleImageClick = (index) => {
    // In step 0, we're selecting the first image
    if (currentStep === 0) {
      setSelectedImages([index]);
      setCurrentStep(1);
    } 
    // In step 1, we're selecting the second image
    else if (currentStep === 1) {
      if (selectedImages.includes(index)) {
        // Clicking the same image deselects it
        setSelectedImages(selectedImages.filter(i => i !== index));
      } else {
        // Add as second image or replace the existing second one
        setSelectedImages([selectedImages[0], index]);
      }
    }
  };

  const handleCombineClick = async () => {
    if (selectedImages.length !== 2) return;
    
    setCurrentStep(2); // Move to loading step
    // setIsLoading(true);
    setError(null);
    
    try {
      const formData = new URLSearchParams();
      formData.append('image1', images[selectedImages[0]]);
      formData.append('image2', images[selectedImages[1]]);
      
      const response = await fetch('http://localhost:8080/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': localStorage.getItem('token'),
        },
        body: formData.toString(),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCombinedImage(data.imageUrl);
      setCurrentStep(3); // Move to result step
    } catch (err) {
      console.error('Error combining images:', err);
      setError('Failed to combine images. Please try again.');
      setCurrentStep(1); // Go back to selection step on error
    } finally {
      // setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      
      // If going back from step 2 (second image), remove second selection
      if (currentStep === 2 && selectedImages.length === 2) {
        setSelectedImages([selectedImages[0]]);
      }
    }
  };

  const handleNextClick = () => {
    if (currentStep < 3) {
      if (currentStep === 1 && selectedImages.length === 2) {
        handleCombineClick();
      } else if (currentStep === 0 && selectedImages.length === 1) {
        setCurrentStep(1);
      }
    }
  };

  const handleRestart = () => {
    setSelectedImages([]);
    setCombinedImage(null);
    setCurrentStep(0);
    setError(null);
  };

  // Render the image grid for selection
  const renderImageGrid = () => (
    <div className="image-grid">
      {images.map((src, index) => (
        <div
          key={index}
          className={`image-container ${selectedImages.includes(index) ? 'selected' : ''}`}
          onClick={() => handleImageClick(index)}
        >
          <img src={"/images/" + src} alt={`Selection option ${index + 1}`} />
          {selectedImages.includes(index) && (
            <div className="selection-indicator">
              {selectedImages.indexOf(index) + 1}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return isLoggedIn ? (
    <div className="app-container">
      <h1 className="app-title">Brain Rot Generator</h1>
      
      {/* Step indicator dots */}
      <div className="step-indicator">
        {[0, 1, 2, 3].map((step) => (
          <div 
            key={step} 
            className={`step-dot ${currentStep === step ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="step-container">
        {/* Step 1: Select first image */}
        <div className={`step-content ${currentStep === 0 ? 'active' : ''}`}>
          <h2 className="step-title">Step 1: Select First Image</h2>
          {renderImageGrid()}
          <div className="nav-buttons">
            <button className="nav-button back" onClick={handleBackClick} disabled={currentStep === 0}>
              Back
            </button>
            <button 
              className="nav-button" 
              onClick={handleNextClick} 
              disabled={selectedImages.length < 1}
            >
              Next
            </button>
          </div>
        </div>

        {/* Step 2: Select second image */}
        <div className={`step-content ${currentStep === 1 ? 'active' : ''}`}>
          <h2 className="step-title">Step 2: Select Second Image</h2>
          {renderImageGrid()}
          <div className="nav-buttons">
            <button className="nav-button back" onClick={handleBackClick}>
              Back
            </button>
            <button 
              className="nav-button" 
              onClick={handleNextClick} 
              disabled={selectedImages.length !== 2}
            >
              Combine Images
            </button>
          </div>
        </div>

        {/* Step 3: Loading state */}
        <div className={`step-content ${currentStep === 2 ? 'active' : ''}`}>
          <div className="loading-container">
            <div className="preview-container">
              {selectedImages.length > 0 && (
                <img 
                  src={images[selectedImages[0]]} 
                  alt="First selection" 
                  className="preview-image" 
                />
              )}
              <div className="plus-icon">+</div>
              {selectedImages.length > 1 && (
                <img 
                  src={images[selectedImages[1]]} 
                  alt="Second selection" 
                  className="preview-image" 
                />
              )}
            </div>
            <div className="loading-spinner"></div>
            <p className="loading-text">Generating brain rot... Please wait...</p>
          </div>
        </div>

        {/* Step 4: Result */}
        <div className={`step-content ${currentStep === 3 ? 'active' : ''}`}>
          <h2 className="step-title">Combined Result</h2>
          <div className="result-container">
            {combinedImage && (
              <img src={combinedImage} alt="Combined result" className="result-image" />
            )}
            <p className="result-message">Brain rot successfully generated!</p>
            <button className="nav-button restart-button" onClick={handleRestart}>
              Start Over
            </button>
          </div>
        </div>

        {/* Error message overlay */}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  ) : (
    <div className="login-container">
      <h1 className="login-title">Login Required</h1>
      <input
        type="password"
        placeholder="Enter password"
        className="login-input"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleLogin(e.target.value);
          }
        }}
      />
      <button className="login-button" onClick={() => handleLogin(document.querySelector('.login-input').value)}>Login</button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default App;
