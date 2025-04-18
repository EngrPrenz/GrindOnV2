import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config (same as your other files)
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

const cartDiv = document.getElementById("cart");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      cartDiv.innerHTML = "You must be signed in to view your cart.";
      return;
    }
  }

  loadCart(auth.currentUser.uid);
});

async function loadCart(uid) {
  try {
    const cartRef = collection(db, "users", uid, "cart");
    const cartSnap = await getDocs(cartRef);

    if (cartSnap.empty) {
      cartDiv.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }

    const items = [];
    cartSnap.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        ...data
      });
    });

    cartDiv.innerHTML = items.map(item => `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <img src="${item.image}" style="max-width:100px;" />
        <h3>${item.name}</h3>
        <p><strong>Price:</strong> $${item.price}</p>
        <button onclick="removeFromCart('${uid}', '${item.id}')">Remove</button>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    cartDiv.innerHTML = "Failed to load cart.";
  }
}

window.removeFromCart = async (uid, itemId) => {
  if (!confirm("Remove this item from your cart?")) return;

  try {
    await deleteDoc(doc(db, "users", uid, "cart", itemId));
    alert("Item removed.");
    loadCart(uid);
  } catch (err) {
    console.error(err);
    alert("Failed to remove item.");
  }
};
