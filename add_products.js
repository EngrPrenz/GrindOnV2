// admin-add-product.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Form listener
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = parseFloat(document.getElementById("price").value);
  const imageUrl = document.getElementById("imageUrl").value;
  const color = document.getElementById("color").value.toLowerCase();

  const small = parseInt(document.getElementById("small").value);
  const medium = parseInt(document.getElementById("medium").value);
  const large = parseInt(document.getElementById("large").value);

  // Construct product object
  const product = {
    name,
    description,
    price,
    imageUrl,
    variations: {
      [color]: {
        small,
        medium,
        large
      }
    }
  };

  try {
    await addDoc(collection(db, "products"), product);
    alert("Product added successfully!");
    document.getElementById("addProductForm").reset();
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Failed to add product.");
  }
});
