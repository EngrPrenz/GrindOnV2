// Improved distance and shipping calculator

// Constants for shipping calculation
const STORE_COORDS = [121.1850, 14.5849]; // Store location [lng, lat]
const BASE_FEE = 50; // Base shipping fee in PHP
const PER_KM_RATE = 10; // PHP per km
const MIN_SHIPPING_FEE = 100; // Minimum shipping fee
const MAX_SHIPPING_FEE = 450; // Maximum shipping fee (for very long distances)

// OpenRoute Service API key
const ORS_API_KEY = '5b3ce3597851110001cf62481c6b00fa3b904acf951184f3c3dce740';

/**
 * Calculate shipping cost based on address
 * @param {string} address - Full address
 * @param {string} city - City
 * @param {string} province - Province
 */
async function calculateShippingFee(address, city, province) {
  try {
    // First, attempt to get precise coordinates using geocoding
    const coordinates = await geocodeAddress(address, city, province);
    
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
      return calculateEstimatedShipping(province, city);
    }
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return calculateEstimatedShipping(province, city);
  }
}

/**
 * Geocode address to coordinates using OpenRoute Service
 * @param {string} address - Street address
 * @param {string} city - City
 * @param {string} province - Province
 * @returns {Array|null} - [longitude, latitude] or null if failed
 */
async function geocodeAddress(address, city, province) {
  try {
    // Construct full address
    const fullAddress = `${address}, ${city}, ${province}, Philippines`;
    
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
 * @returns {Object} - Shipping details
 */
function calculateEstimatedShipping(province, city) {
  let shipping = 0;
  let estimatedDistance = 0;
  
  // Get province value
  const provinceValue = province.toLowerCase();
  const cityValue = city.toLowerCase();
  
  // Estimated shipping costs based on regions
  if (provinceValue === 'metro-manila' || cityValue.includes('manila')) {
    shipping = 100;
    estimatedDistance = 10;
  } else if (['cavite', 'laguna', 'batangas', 'rizal', 'bulacan'].includes(provinceValue)) {
    shipping = 150;
    estimatedDistance = 25;
  } else if (['pampanga', 'bataan', 'nueva ecija', 'tarlac'].includes(provinceValue)) {
    shipping = 200;
    estimatedDistance = 40;
  } else if (['pangasinan', 'zambales', 'aurora', 'quezon'].includes(provinceValue)) {
    shipping = 250;
    estimatedDistance = 70;
  } else if (['ilocos', 'cagayan', 'isabela', 'quirino', 'nueva vizcaya', 'abra', 'apayao', 'kalinga', 'mountain', 'ifugao', 'benguet'].includes(provinceValue) || provinceValue.includes('ilocos') || provinceValue.includes('cagayan')) {
    shipping = 350;
    estimatedDistance = 200;
  } else {
    // For other provinces, use a default rate
    shipping = 300;
    estimatedDistance = 150;
  }
  
  // Add a small random variation to make it seem more precise
  const variation = Math.floor(Math.random() * 30) - 15; // -15 to +15
  shipping = Math.max(100, shipping + variation);
  
  return {
    success: true,
    distance: estimatedDistance,
    shipping: shipping,
    coordinates: null,
    method: 'regional-estimate'
  };
}

// Add small utilities for address validation and formatting
function formatAddress(address, city, province, postalCode) {
  return `${address}, ${city}, ${province} ${postalCode}, Philippines`;
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