import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
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

// Target the user option div
const userOptionDiv = document.querySelector('.user_option');

onAuthStateChanged(auth, (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    const uid = user.uid;
    const userDocRef = doc(db, "users", uid);

    getDoc(userDocRef).then((docSnap) => {
      let displayName = "User";
      if (docSnap.exists() && docSnap.data().username) {
        displayName = docSnap.data().username;
      }

      userOptionDiv.innerHTML = `
        <a href="cart.html">
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
        </a> 
        <span style="color: white; margin-right: 10px;">Hi, <strong>${displayName}</strong></span>
        <a href="#" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          <span style="color: white;">Logout</span>
        </a>
      `;

      document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
          location.reload();
        }).catch((error) => {
          alert("Logout failed: " + error.message);
        });
      });

    }).catch((error) => {
      console.error("Failed to fetch username:", error);
      const fallbackName = user.email.substring(0, 4) + "...";
      userOptionDiv.innerHTML = `
        <span style="color: white; margin-right: 10px;">Hi, ${fallbackName}</span>
        <a href="#" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          <span style="color: white;">Logout</span>
        </a>
      `;

      document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
          location.reload();
        }).catch((error) => {
          alert("Logout failed: " + error.message);
        });
      });
    });

  } else {
    userOptionDiv.innerHTML = `
      <a href="login.html">
        <i class="fa fa-user" aria-hidden="true"></i>
        <span style="color: white;">Login</span>
      </a>
      <a href="register.html">
        <i class="fa fa-vcard" aria-hidden="true"></i>
        <span style="color: white;">Register</span>
      </a>
    `;
  }
});

async function loadLatestProducts() {
  const latestProductsContainer = document.getElementById("latestProducts");
  latestProductsContainer.innerHTML = "<div class='loading'>Loading products...</div>";

  try {
    // Query the 3 latest products
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);
    latestProductsContainer.innerHTML = "";

    if (snapshot.empty) {
      latestProductsContainer.innerHTML = "<p class='no-products'>No products found.</p>";
      return;
    }

    let isActive = true; // To set the first carousel item as active
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const imageUrl = Array.isArray(data.imageUrls) && data.imageUrls.length > 0
        ? data.imageUrls[0]
        : "images/default-placeholder.png"; // Fallback image

      const productItem = document.createElement("div");
      productItem.className = `carousel-item ${isActive ? "active" : ""}`;
      isActive = false; // Only the first item should be active

      productItem.innerHTML = `
        <div class="box">
          <a href="product.html?id=${id}">
            <div class="img-box">
              <img src="${imageUrl}" alt="${data.name}">
            </div>
            <div class="detail-box">
              <h6>${data.name}</h6>
              <h6>Price: <span>₱${data.price}</span></h6>
            </div>
          </a>
        </div>
      `;

      latestProductsContainer.appendChild(productItem);
    });
  } catch (err) {
    console.error("Error fetching latest products:", err);
    latestProductsContainer.innerHTML = "<p class='error'>Error loading products.</p>";
  }
}

// Call the function to load products
loadLatestProducts();