import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
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

// Modal variables
let currentImages = [];
let currentIndex = 0;

const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeImageModal");
const nextBtn = document.getElementById("nextImage");
const prevBtn = document.getElementById("prevImage");
const userOptionDiv = document.querySelector('.user_option');

onAuthStateChanged(auth, (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    userOptionDiv.innerHTML = `
      <span style="color: white; margin-right: 10px;">Hi, ${user.email}</span>
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
        <p>$${data.price}</p>
        <hr/>
      `;
    
      const img = productDiv.querySelector("img");
      img.addEventListener("click", () => showModal(imageArray, 0));
      productDiv.addEventListener("click", (e) => {
        if (e.target.tagName !== "IMG") {
          window.location.href = `product.html?id=${id}`;
        }
      });
    
      productsList.appendChild(productDiv);
    });
    

  } catch (err) {
    console.error("Error fetching products:", err);
    productsList.innerHTML = "<p>Error loading products.</p>";
  }
}


loadProducts();
