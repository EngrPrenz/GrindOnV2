// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc,
    setDoc
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin document ID
const ADMIN_DOC_ID = "fYjAozm0odaXgjkeYbnh";

// Function to show messages with styling
function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = isError ? "message error" : "message success";
}

// Button click event
document.getElementById('addAdmin').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const newUserPassword = document.getElementById('newAdminPassword').value.trim();
    const adminPassword = document.getElementById('adminPassword').value.trim();

    if (!email || !newUserPassword || !adminPassword) {
        showMessage("Please fill in all fields.", true);
        return;
    }

    try {
        // Get admin document reference
        const adminDocRef = doc(db, "admin", ADMIN_DOC_ID);
        const adminDocSnap = await getDoc(adminDocRef);

        // First-time setup check
        if (!adminDocSnap.exists()) {
            console.log("First time admin setup - document doesn't exist");
            
            try {
                // Step 1: Create new user in Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, newUserPassword);
                const newUser = userCredential.user;
                const userId = newUser.uid;

                // Step 2: Create the admin document with this user as first admin
                await setDoc(adminDocRef, {
                    adminPassword: adminPassword,
                    adminUsers: [{
                        userId: userId,
                        email: email,
                        role: 'admin',
                        permissions: ['manage_all'],
                        addedAt: new Date().toISOString()
                    }]
                });

                showMessage("First admin user created successfully!");
            } catch (authError) {
                console.error("Error in first-time setup:", authError);
                showMessage("Error creating first admin: " + authError.message, true);
            }
            return;
        }

        // The document exists but check if it's empty or missing adminUsers
        const adminData = adminDocSnap.data();
        console.log("Admin document data:", adminData);
        
        if (!adminData || Object.keys(adminData).length === 0 || !adminData.adminUsers) {
            console.log("First time admin setup - document exists but is empty");
            
            try {
                // Step 1: Create new user in Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, newUserPassword);
                const newUser = userCredential.user;
                const userId = newUser.uid;

                // Step 2: Update the admin document with this user as first admin
                await updateDoc(adminDocRef, {
                    adminPassword: adminPassword,
                    adminUsers: [{
                        userId: userId,
                        email: email,
                        role: 'admin',
                        permissions: ['manage_all'],
                        addedAt: new Date().toISOString()
                    }]
                });

                showMessage("First admin user created successfully!");
            } catch (authError) {
                console.error("Error in first-time setup (update):", authError);
                showMessage("Error creating first admin: " + authError.message, true);
            }
            return;
        }

        // If we get here, this is NOT the first admin setup
        // Check admin password
        if (adminData.adminPassword !== adminPassword) {
            showMessage("Incorrect admin password.", true);
            return;
        }

        // Step 1: Create new user in Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, newUserPassword);
        const newUser = userCredential.user;
        const userId = newUser.uid;

        // Step 2: Add the user to Firestore adminUsers array
        const updatedAdminUsers = adminData.adminUsers || [];
        
        // Check if user is already an admin
        if (updatedAdminUsers.some(admin => admin.email === email)) {
            showMessage("This email is already registered as an admin.", true);
            return;
        }
        
        updatedAdminUsers.push({
            userId: userId,
            email: email,
            role: 'admin',
            permissions: ['manage_all'],
            addedAt: new Date().toISOString()
        });

        await updateDoc(adminDocRef, {
            adminUsers: updatedAdminUsers
        });

        showMessage("Admin user created successfully!");

    } catch (error) {
        console.error("Error adding admin:", error);
        showMessage("Error: " + error.message, true);
    }
});