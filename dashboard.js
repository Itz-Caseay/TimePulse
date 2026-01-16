const checkInBtn = document.getElementById('checkin-button');

// ===== GEOLOCATION-BASED CHECK-IN VERIFICATION =====
// Define the exact allowed location for check-in
const ALLOWED_LOCATION = {
  latitude: 3.98769,
  longitude: 11.51342,
  radiusInMeters: 225 // user must be within 25 meters
};


/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - User's latitude
 * @param {number} lon1 - User's longitude
 * @param {number} lat2 - Allowed location latitude
 * @param {number} lon2 - Allowed location longitude
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verify if user is at the exact allowed location
 * @returns {Promise<boolean>} True if at exact location, false otherwise
 */
function verifyCheckInLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser!');
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Calculate distance from allowed location
        const distance = calculateDistance(
          userLat,
          userLon,
          ALLOWED_LOCATION.latitude,
          ALLOWED_LOCATION.longitude
        );

        // Log for debugging
        console.log(`User position: ${userLat}, ${userLon}`);
        console.log(`Distance from allowed location: ${distance.toFixed(2)} meters`);

        // Check if user is within the allowed radius
        if (distance <= ALLOWED_LOCATION.radiusInMeters) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      (error) => {
        // Handle geolocation errors
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out.');
            break;
          default:
            alert('An unknown error occurred while retrieving location.');
        }
        resolve(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Handle check-in with location verification
 */
async function handleCheckIn() {
  // Disable button to prevent multiple clicks
  checkInBtn.disabled = true;
  checkInBtn.textContent = 'Verifying location...';

  try {
    const isAtAllowedLocation = await verifyCheckInLocation();

    if (isAtAllowedLocation) {
      // Check-in allowed
      checkInBtn.textContent = '✓ Check-in Successful';
      checkInBtn.style.backgroundColor = '#4CAF50';
      alert('Check-in successful! You are at the correct location.');
      
      // You can add your check-in logic here
      console.log('Check-in completed at', new Date());
      
      // Reset button after 3 seconds
      setTimeout(() => {
        checkInBtn.disabled = false;
        checkInBtn.textContent = 'Check In';
        checkInBtn.style.backgroundColor = '';
      }, 3000);
    } else {
      // Check-in denied - user is not at exact location
      checkInBtn.textContent = '✗ Check-in Denied';
      checkInBtn.style.backgroundColor = '#f44336';
      alert('Check-in DENIED! You are not at the required location. Please visit the exact location to check in.');
      
      // Reset button after 3 seconds
      setTimeout(() => {
        checkInBtn.disabled = false;
        checkInBtn.textContent = 'Check In';
        checkInBtn.style.backgroundColor = '';
      }, 3000);
    }
  } catch (error) {
    console.error('Check-in error:', error);
    alert('An error occurred during check-in. Please try again.');
    checkInBtn.disabled = false;
    checkInBtn.textContent = 'Check In';
  }
}

// Attach event listener to check-in button
if (checkInBtn) {
  checkInBtn.addEventListener('click', handleCheckIn);
}
