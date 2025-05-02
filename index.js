const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore(); // Initialize Firestore

const ORS_API_KEY = "5b3ce3597851110001cf62481c6b00fa3b904acf951184f3c3dce740";

// Cloud function for geocoding and storing results
exports.geocodeAddress = functions.https.onRequest(async (req, res) => {
  const { address, city, province, userId } = req.body;

  if (!address || !city || !province || !userId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const fullAddress = `${address}, ${city}, ${province}, Philippines`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const apiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodedAddress}&boundary.country=PHL`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch");
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates;

      // Optionally store the geocoded address in Firestore
      await db.collection("addresses").doc(userId).set({
        address: fullAddress,
        coordinates: coordinates,
        city: city,
        province: province,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({
        success: true,
        coordinates: coordinates,
        message: "Address geocoded and saved successfully",
      });
    } else {
      return res.status(404).json({ error: "Address not found" });
    }
  } catch (error) {
    console.error("Geocode error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
});
