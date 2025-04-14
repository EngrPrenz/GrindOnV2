import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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
    const snapshot = await getDocs(collection(db, "products"));
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
        <button class="delete-btn" data-id="${id}">🗑 Delete</button>
        <button class="edit-btn" data-id="${id}" data-product='${JSON.stringify(data).replace(/'/g, "&apos;")}'>✏ Edit</button>
        <hr/>
      `;

      productsList.appendChild(productDiv);
    });

    // Attach event listeners safely after rendering
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        deleteProduct(id);
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const data = JSON.parse(btn.dataset.product.replace(/&apos;/g, "'"));
        openEditModal(id, data);
      });
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

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    await deleteDoc(doc(db, "products", productId));
    alert("Product deleted.");
    loadProducts();
  } catch (err) {
    console.error("Error deleting:", err);
    alert("Failed to delete.");
  }
}

function openEditModal(id, data) {
  const modal = document.getElementById("editModal");
  modal.style.display = "flex";

  document.getElementById("editId").value = id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editDesc").value = data.description;
  document.getElementById("editPrice").value = data.price;
  document.getElementById("editImage").value = data.imageUrl;

  const color = Object.keys(data.variations)[0];
  const sizes = data.variations[color];

  document.getElementById("editColor").value = color;
  document.getElementById("editSmall").value = sizes.small;
  document.getElementById("editMedium").value = sizes.medium;
  document.getElementById("editLarge").value = sizes.large;
}

document.getElementById("editForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const updated = {
    name: document.getElementById("editName").value,
    description: document.getElementById("editDesc").value,
    price: parseFloat(document.getElementById("editPrice").value),
    imageUrl: document.getElementById("editImage").value,
    variations: {
      [document.getElementById("editColor").value.toLowerCase()]: {
        small: parseInt(document.getElementById("editSmall").value),
        medium: parseInt(document.getElementById("editMedium").value),
        large: parseInt(document.getElementById("editLarge").value)
      }
    }
  };

  try {
    await updateDoc(doc(db, "products", id), updated);
    alert("Product updated!");
    document.getElementById("editModal").style.display = "none";
    loadProducts();
  } catch (err) {
    console.error("Update failed:", err);
    alert("Update failed.");
  }
});

document.getElementById("closeModal").onclick = () => {
  document.getElementById("editModal").style.display = "none";
};

loadProducts();
