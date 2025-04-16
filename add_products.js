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

let uploadedImageUrls = []; // Store uploaded image URLs here

// Form submit handler
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = parseFloat(document.getElementById("price").value);
  const color = document.getElementById("color").value.toLowerCase();
  const small = parseInt(document.getElementById("small").value);
  const medium = parseInt(document.getElementById("medium").value);
  const large = parseInt(document.getElementById("large").value);

  if (uploadedImageUrls.length === 0) {
    alert("⚠️ Please upload at least one image.");
    return;
  }

  const product = {
    name,
    description,
    price,
    imageUrls: uploadedImageUrls, // now storing as array
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
    document.getElementById("imagePreviewContainer").innerHTML = "";
    document.getElementById("imageUrl").value = "";
    uploadedImageUrls = [];
  } catch (error) {
    console.error("Error adding product:", error);
    alert("❌ Failed to add product.");
  }
});

// Show image previews
document.getElementById("uploadImage").addEventListener("change", function () {
  const files = this.files;
  const previewContainer = document.getElementById("imagePreviewContainer");
  previewContainer.innerHTML = "";

  if (files.length > 0) {
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  }
});

// Upload images to ImgBB
document.getElementById("uploadToImgBB").addEventListener("click", async () => {
  const fileInput = document.getElementById("uploadImage");
  const files = fileInput.files;

  if (!files.length) {
    alert("⚠️ Please select image(s) first.");
    return;
  }

  uploadedImageUrls = [];
  document.getElementById("uploadToImgBB").innerText = "⏳ Uploading...";

  for (let file of files) {
    const base64 = await fileToBase64(file);
    try {
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: "54d7f9f504ad8667bd240160609fd2b4", // Your ImgBB API key
          image: base64.split(",")[1]
        })
      });

      const result = await response.json();

      if (result.success) {
        uploadedImageUrls.push(result.data.url);
      } else {
        console.error("Upload failed for one image:", result);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  }

  document.getElementById("imageUrl").value = uploadedImageUrls.join(", ");
  document.getElementById("uploadToImgBB").innerText = "✅ Upload to ImgBB";
  alert("🎉 All images uploaded successfully!");
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
