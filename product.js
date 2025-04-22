import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    collection,
  addDoc,
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.appspot.com",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Extract ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const productDetail = document.getElementById("productDetail");

async function fetchProduct() {
  if (!productId) {
    productDetail.innerHTML = "No product ID provided.";
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      productDetail.innerHTML = "Product not found.";
      return;
    }

    const data = productSnap.data();
    const images = data.imageUrls || [data.imageUrl] || [];

    productDetail.innerHTML = `
      <h2>${data.name}</h2>
      <img src="${images[0]}" style="max-width:300px" />
      <p><strong>Description:</strong> ${data.description}</p>
      <p><strong>Price:</strong> $${data.price}</p>
      <div>${renderVariations(data.variations)}</div>
      <button id="addToCartBtn">Add to Cart</button>
    `;

    document.getElementById("addToCartBtn").onclick = async () => {
        const user = auth.currentUser;
      
        if (!user) {
          const provider = new GoogleAuthProvider();
          try {
            await signInWithPopup(auth, provider);
          } catch (err) {
            console.error("Authentication failed", err);
            alert("Sign in failed. Cannot add to cart.");
            return;
          }
        }
      
        // Re-check current user after sign-in
        const currentUser = auth.currentUser;
        if (!currentUser) return;
      
        try {
          await addDoc(collection(db, "users", currentUser.uid, "cart"), {
            productId,
            name: data.name,
            price: data.price,
            image: images[0],
            addedAt: new Date()
          });
      
          alert("Added to cart!");
        } catch (err) {
          console.error("Failed to add to cart", err);
          alert("Error adding to cart.");
        }
      };

  } catch (err) {
    console.error(err);
    productDetail.innerHTML = "Error loading product.";
  }
}

function renderVariations(variations) {
  return Object.entries(variations).map(([color, sizes]) => {
    return `<p><strong>${color.toUpperCase()}</strong>: Small(${sizes.small}), Medium(${sizes.medium}), Large(${sizes.large})</p>`;
  }).join("");
}

fetchProduct();