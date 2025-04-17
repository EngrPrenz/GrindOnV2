import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadProducts() {
  const productsList = document.getElementById("productsList");
  productsList.innerHTML = "Loading...";

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    productsList.innerHTML = "";

    if (snapshot.empty) {
      productsList.innerHTML = "<p>No products found.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;

      const productDiv = document.createElement("div");
      productDiv.className = "product";
      productDiv.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.name}" style="max-width:150px;" />
        <h3>${data.name}</h3>
        <p><strong>Description:</strong> ${data.description}</p>
        <p><strong>Price:</strong> $${data.price}</p>
        <div>${renderVariations(data.variations)}</div>
        <hr/>
      `;

      productsList.appendChild(productDiv);
    });


  } catch (err) {
    console.error("Error fetching products:", err);
    productsList.innerHTML = "<p>Error loading products.</p>";
  }
}

function renderVariations(variations) {
  return Object.entries(variations).map(([color, sizes]) => {
    return `
      <p><strong>${color.toUpperCase()}</strong>: Small(${sizes.small}), Medium(${sizes.medium}), Large(${sizes.large})</p>
    `;
  }).join("");
}



loadProducts();
