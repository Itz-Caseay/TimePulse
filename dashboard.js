const checkInBtn = document.getElementById('checkin-button');

// ===== GEOLOCATION-BASED CHECK-IN VERIFICATION =====
// Define the exact allowed location for check-in
const ALLOWED_LOCATION = {
  latitude: 3.98769,
  longitude: 11.51342,
  radiusInMeters: 225 // user must be within 25 meters
};

// Timer variables
let checkInTime = null;
let timerInterval = null;
let totalTimeSpent = 0;


/**
 * Format time from seconds to HH:MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Start the timer and display elapsed time
 */
function startTimer() {
  checkInTime = Date.now();
  
  // Create timer display
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'timer-display';
  timerDisplay.style.cssText = `
    background: #4CAF50;
    color: white;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    font-family: monospace;
  `;
  timerDisplay.textContent = '00:00:00';
  
  const checkinForm = document.querySelector('.checkin');
  checkinForm.parentNode.insertBefore(timerDisplay, checkinForm);
  
  // Update timer every second
  timerInterval = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - checkInTime) / 1000);
    timerDisplay.textContent = formatTime(elapsedTime);
  }, 1000);
}

/**
 * Create and show checkout button
 */
function createCheckoutButton() {
  // Hide check-in button
  checkInBtn.style.display = 'none';
  
  // Create checkout button
  const checkoutBtn = document.createElement('button');
  checkoutBtn.id = 'checkout-button';
  checkoutBtn.textContent = 'Check Out';
  checkoutBtn.style.cssText = `
    background: #ff9800;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s ease;
  `;
  
  checkoutBtn.onmouseover = () => { checkoutBtn.style.background = '#e68900'; };
  checkoutBtn.onmouseout = () => { checkoutBtn.style.background = '#ff9800'; };
  
  checkoutBtn.addEventListener('click', handleCheckOut);
  
  checkInBtn.parentNode.insertBefore(checkoutBtn, checkInBtn);
}

/**
 * Handle check-out and record total time
 */
async function handleCheckOut() {
  // Verify user is still at the location
  const checkoutBtn = document.getElementById('checkout-button');
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Verifying location...';
  
  const isAtAllowedLocation = await verifyCheckInLocation();
  
  if (!isAtAllowedLocation) {
    alert('Check-out DENIED! You must be at the required location to check out.');
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Check Out';
    return;
  }
  
  // Clear timer
  clearInterval(timerInterval);
  
  // Calculate total time spent
  totalTimeSpent = Math.floor((Date.now() - checkInTime) / 1000);
  const formattedTime = formatTime(totalTimeSpent);
  
  // Update button appearance
  checkoutBtn.textContent = '✓ Checked Out';
  checkoutBtn.style.background = '#4CAF50';
  checkoutBtn.disabled = true;
  
  // Update timer display
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.style.background = '#4CAF50';
    timerDisplay.textContent = `Time Spent: ${formattedTime}`;
  }
  
  alert(`Check-out successful! Total time spent: ${formattedTime}`);
  
  // Log the attendance record
  const attendanceRecord = {
    checkInTime: new Date(checkInTime).toLocaleString(),
    checkOutTime: new Date().toLocaleString(),
    totalTimeSpent: formattedTime,
    totalSeconds: totalTimeSpent
  };
  
  console.log('Attendance Record:', attendanceRecord);
  
  // You can send this data to your server here
  // Example: saveAttendanceToServer(attendanceRecord);
  
  // Reset after 4 seconds
  setTimeout(() => {
    checkInBtn.style.display = 'block';
    checkoutBtn.remove();
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.remove();
    checkInBtn.disabled = false;
    checkInBtn.textContent = 'Check In';
    checkInBtn.style.backgroundColor = '';
  }, 4000);
}

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
      
      // Start timer and show checkout button
      startTimer();
      createCheckoutButton();
      
      // You can add your check-in logic here
      console.log('Check-in completed at', new Date());
      
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
