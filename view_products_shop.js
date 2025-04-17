import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Modal variables
let currentImages = [];
let currentIndex = 0;

const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeImageModal");
const nextBtn = document.getElementById("nextImage");
const prevBtn = document.getElementById("prevImage");

function showModal(images, index) {
  currentImages = images;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
  modal.style.display = "flex";
}

closeModal.onclick = () => {
  modal.style.display = "none";
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % currentImages.length;
  modalImage.src = currentImages[currentIndex];
};

prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  modalImage.src = currentImages[currentIndex];
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

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
    
      let imageArray = [];
      if (Array.isArray(data.imageUrls)) {
        imageArray = data.imageUrls;
      } else if (typeof data.imageUrl === "string") {
        imageArray = [data.imageUrl];
      }
    
      const firstImage = imageArray[0] || "images/default-placeholder.png"; // fallback
    
      const productDiv = document.createElement("div");
      productDiv.className = "product";
      productDiv.innerHTML = `
        <img src="${firstImage}" alt="${data.name}" style="max-width:150px; cursor:pointer;" />
        <h3>${data.name}</h3>
        <p><strong>Description:</strong> ${data.description}</p>
        <p><strong>Price:</strong> $${data.price}</p>
        <div>${renderVariations(data.variations)}</div>
        <hr/>
      `;
    
      const img = productDiv.querySelector("img");
      img.addEventListener("click", () => showModal(imageArray, 0));
    
      productsList.appendChild(productDiv);
    });
    

  } catch (err) {
    console.error("Error fetching products:", err);
    productsList.innerHTML = "<p>Error loading products.</p>";
  }
}

function renderVariations(variations) {
  return Object.entries(variations).map(([color, sizes]) => {
    return `<p><strong>${color.toUpperCase()}</strong>: Small(${sizes.small}), Medium(${sizes.medium}), Large(${sizes.large})</p>`;
  }).join("");
}

loadProducts();
