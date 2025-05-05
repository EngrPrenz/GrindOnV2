// Improved distance and shipping calculator

// Constants for shipping calculation
const STORE_COORDS = [121.1755, 14.6208]; // URS Antipolo Campus [lng, lat]
const BASE_FEE = 50; // Base shipping fee in PHP
const PER_KM_RATE = 10; // PHP per km
const MIN_SHIPPING_FEE = 100; // Minimum shipping fee
const MAX_SHIPPING_FEE = 450; // Maximum shipping fee (for very long distances)

// OpenRoute Service API key
const ORS_API_KEY = '5b3ce3597851110001cf62481c6b00fa3b904acf951184f3c3dce740';

/**
 * Calculate shipping cost based on address
 * @param {string} address - Street address
 * @param {string} barangay - Barangay/Village
 * @param {string} city - City
 * @param {string} province - Province
 */
async function calculateShippingFee(address, barangay, city, province) {
  try {
    // First, attempt to get precise coordinates using geocoding
    const coordinates = await geocodeAddress(address, barangay, city, province);
    
    if (coordinates) {
      // If we got coordinates, calculate actual distance
      const distance = calculateDistance(STORE_COORDS, coordinates);
      
      // Calculate shipping fee based on distance
      const shipping = calculateFeeFromDistance(distance);
      
      return {
        success: true,
        distance: distance,
        shipping: shipping,
        coordinates: coordinates,
        method: 'geocoding'
      };
    } else {
      // Fallback to region-based estimation
      return calculateEstimatedShipping(province, city, barangay);
    }
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return calculateEstimatedShipping(province, city, barangay);
  }
}

/**
 * Geocode address to coordinates using OpenRoute Service
 * @param {string} address - Street address
 * @param {string} barangay - Barangay/Village
 * @param {string} city - City
 * @param {string} province - Province
 * @returns {Array|null} - [longitude, latitude] or null if failed
 */
async function geocodeAddress(address, barangay, city, province) {
  try {
    // Construct full address with barangay for better accuracy
    const fullAddress = `${address}, ${barangay}, ${city}, ${province}, Philippines`;
    
    // URL encode the address
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Construct the API URL
    const apiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodedAddress}&boundary.country=PHL`;
    
    // Make the API request
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Check if we got valid results
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates;
      return coordinates; // [longitude, latitude]
    }
    
    // Try again without the street address if first attempt failed
    const simplifiedAddress = `${barangay}, ${city}, ${province}, Philippines`;
    const encodedSimplifiedAddress = encodeURIComponent(simplifiedAddress);
    
    const simplifiedApiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodedSimplifiedAddress}&boundary.country=PHL`;
    
    const simplifiedResponse = await fetch(simplifiedApiUrl);
    const simplifiedData = await simplifiedResponse.json();
    
    if (simplifiedData.features && simplifiedData.features.length > 0) {
      return simplifiedData.features[0].geometry.coordinates;
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param {Array} point1 - [longitude, latitude] of first point
 * @param {Array} point2 - [longitude, latitude] of second point
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(point1, point2) {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  // Convert to radians
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const radLon1 = (lon1 * Math.PI) / 180;
  const radLon2 = (lon2 * Math.PI) / 180;
  
  // Earth radius in kilometers
  const earthRadius = 6371;
  
  // Calculate differences
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  
  return parseFloat(distance.toFixed(2)); // Return with 2 decimal points
}

/**
 * Calculate shipping fee based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {number} - Shipping fee in PHP
 */
function calculateFeeFromDistance(distance) {
  // Base fee plus per-kilometer rate
  let fee = BASE_FEE + (distance * PER_KM_RATE);
  
  // Apply minimum and maximum bounds
  fee = Math.max(MIN_SHIPPING_FEE, fee);
  fee = Math.min(MAX_SHIPPING_FEE, fee);
  
  // Round to nearest 10 PHP to make it look "nicer"
  return Math.round(fee / 10) * 10;
}

/**
 * Fallback method: Calculate estimated shipping based on region
 * @param {string} province - Province name
 * @param {string} city - City name
 * @param {string} barangay - Barangay name (optional)
 * @returns {Object} - Shipping details
 */
function calculateEstimatedShipping(province, city, barangay = '') {
  let shipping = 0;
  let estimatedDistance = 0;
  
  // Convert inputs to lowercase for case-insensitive comparison
  const provinceValue = province.toLowerCase().trim();
  const cityValue = city.toLowerCase().trim();
  const barangayValue = barangay ? barangay.toLowerCase().trim() : '';
  
  // Special case for Antipolo (since our store is in Antipolo URS)
  if (provinceValue === 'rizal' && cityValue.includes('antipolo')) {
    // Define URS Antipolo nearby barangays
    const veryNearBarangays = ['mayamot', 'dela paz', 'cupang', 'mambugan', 'dalig', 'bagong nayon'];
    const nearBarangays = ['san isidro', 'san jose', 'san luis', 'san roque', 'santa cruz'];
    const moderateBarangays = ['beverly hills', 'calawis', 'forest hills', 'muntingdilaw', 'munting dilao'];
    
    // Check if barangay is specified and match to distance group
    if (barangayValue) {
      if (veryNearBarangays.some(b => barangayValue.includes(b))) {
        // Very near barangays to URS
        shipping = 70;
        estimatedDistance = 3;
      } else if (nearBarangays.some(b => barangayValue.includes(b))) {
        // Near barangays
        shipping = 90;
        estimatedDistance = 7;
      } else if (moderateBarangays.some(b => barangayValue.includes(b))) {
        // Moderate distance barangays
        shipping = 110;
        estimatedDistance = 10;
      } else {
        // Other Antipolo barangays
        shipping = 120;
        estimatedDistance = 12;
      }
    } else {
      // If no barangay specified, use general Antipolo estimate
      shipping = 100;
      estimatedDistance = 8;
    }
  } 
  // Special case for Rizal province nearby cities
  else if (provinceValue === 'rizal') {
    if (['taytay', 'cainta'].includes(cityValue)) {
      shipping = 130;
      estimatedDistance = 12;
    } else if (['angono', 'binangonan', 'teresa'].includes(cityValue)) {
      shipping = 150;
      estimatedDistance = 15;
    } else if (['tanay', 'morong', 'baras', 'pililla', 'jala-jala'].includes(cityValue)) {
      shipping = 180;
      estimatedDistance = 20;
    } else if (['rodriguez', 'san mateo'].includes(cityValue)) {
      shipping = 160;
      estimatedDistance = 17;
    } else {
      // Other Rizal locations
      shipping = 170;
      estimatedDistance = 18;
    }
  }
  // Metro Manila
  else if (provinceValue === 'metro-manila' || provinceValue === 'metro manila' || cityValue.includes('manila') || 
          ['pasig', 'quezon city', 'marikina', 'makati', 'taguig', 'pasay', 'parañaque', 'mandaluyong', 
           'san juan', 'caloocan', 'valenzuela', 'malabon', 'navotas', 'muntinlupa', 'las piñas', 'pateros'].includes(cityValue)) {
    
    // Eastern Metro Manila (closer to Antipolo)
    if (['marikina', 'pasig'].includes(cityValue)) {
      shipping = 120;
      estimatedDistance = 12;
    } 
    // Central Metro Manila
    else if (['quezon city', 'mandaluyong', 'san juan'].includes(cityValue)) {
      shipping = 140;
      estimatedDistance = 15;
    }
    // Western/Southern Metro Manila (farther from Antipolo)
    else {
      shipping = 160;
      estimatedDistance = 20;
    }
  } 
  // Laguna - fix the San Pablo issue
  else if (provinceValue === 'laguna') {
    if (cityValue.includes('san pablo')) {
      shipping = 300;
      estimatedDistance = 80;  // San Pablo is quite far from Antipolo
    } else if (['biñan', 'santa rosa', 'cabuyao', 'calamba'].includes(cityValue)) {
      shipping = 220;
      estimatedDistance = 45;
    } else {
      shipping = 260;
      estimatedDistance = 60;
    }
  }
  // Other provinces
  else if (['cavite'].includes(provinceValue)) {
    shipping = 230;
    estimatedDistance = 50;
  } else if (['batangas'].includes(provinceValue)) {
    shipping = 270;
    estimatedDistance = 65;
  } else if (['bulacan'].includes(provinceValue)) {
    shipping = 230;
    estimatedDistance = 50;
  } else if (['pampanga', 'bataan', 'nueva ecija', 'tarlac'].includes(provinceValue)) {
    shipping = 300;
    estimatedDistance = 85;
  } else if (['pangasinan', 'zambales', 'aurora', 'quezon'].includes(provinceValue)) {
    shipping = 330;
    estimatedDistance = 100;
  } else if (['ilocos', 'cagayan', 'isabela', 'quirino', 'nueva vizcaya', 'abra', 'apayao', 'kalinga', 'mountain', 'ifugao', 'benguet'].includes(provinceValue) || provinceValue.includes('ilocos') || provinceValue.includes('cagayan')) {
    shipping = 400;
    estimatedDistance = 200;
  } else {
    // For other provinces, use a default rate
    shipping = 350;
    estimatedDistance = 150;
  }
  
  // Add a small random variation to make it seem more precise (but smaller variation)
  const variation = Math.floor(Math.random() * 20) - 10; // -10 to +10
  shipping = Math.max(70, shipping + variation);
  
  return {
    success: true,
    distance: estimatedDistance,
    shipping: shipping,
    coordinates: null,
    method: 'regional-estimate'
  };
}

// Add small utilities for address validation and formatting
function formatAddress(address, barangay, city, province, postalCode) {
  const barangayPart = barangay ? `${barangay}, ` : '';
  return `${address}, ${barangayPart}${city}, ${province} ${postalCode}, Philippines`;
}

function validateAddress(address, city, province) {
  return Boolean(address && city && province);
}

// Export the functions
window.ShippingCalculator = {
  calculateShippingFee,
  geocodeAddress,
  calculateDistance,
  calculateFeeFromDistance,
  validateAddress,
  formatAddress
};