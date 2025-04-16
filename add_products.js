import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";



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

// Form submit handler
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = parseFloat(document.getElementById("price").value);
  const imageUrl = document.getElementById("imageUrl").value;
  const color = document.getElementById("color").value.toLowerCase();
  const small = parseInt(document.getElementById("small").value);
  const medium = parseInt(document.getElementById("medium").value);
  const large = parseInt(document.getElementById("large").value);

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
    },
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "products"), product);
    alert("✅ Product added successfully!");
    document.getElementById("addProductForm").reset();
    document.getElementById("imagePreview").style.display = "none";
  } catch (error) {
    console.error("Error adding product:", error);
    alert("❌ Failed to add product.");
  }
});

// Show image preview immediately
document.getElementById("uploadImage").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const preview = document.getElementById("imagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// Upload image to ImgBB
document.getElementById("uploadToImgBB").addEventListener("click", async () => {
  const fileInput = document.getElementById("uploadImage");
  const file = fileInput.files[0];

  if (!file) {
    alert("⚠️ Please select an image first.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const base64Image = reader.result.split(',')[1];

    try {
      alert("⏳ Uploading image...");
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: "54d7f9f504ad8667bd240160609fd2b4", // Your ImgBB API key
          image: base64Image
        })
      });

      const result = await response.json();

      if (result.success) {
        const imageUrl = result.data.url;
        document.getElementById("imageUrl").value = imageUrl;
        alert("✅ Image uploaded successfully!");
      } else {
        console.error("Upload failed:", result);
        alert("❌ Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Something went wrong while uploading.");
    }
  };

  reader.readAsDataURL(file);
});
