import { auth, db } from "../firebase_config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Referencia a la lista de usuarios en el DOM
const usersList = document.getElementById("usersList");

// Función para verificar si el usuario es administrador
const isAdmin = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.role === "admin"; // Verificar si el rol es "admin"
  }
  return false;
};

// Función para obtener todos los usuarios desde Firestore
const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef);
  const usersSnapshot = await getDocs(q);

  const users = [];
  usersSnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });

  console.log("Usuarios obtenidos:", users); // Depuración
  return users;
};

// Función para obtener los vehículos de un usuario
const getUserVehicles = async (userId) => {
  const vehiclesRef = collection(db, "vehicles");
  const q = query(vehiclesRef, where("userId", "==", userId));
  const vehiclesSnapshot = await getDocs(q);

  const vehicles = [];
  vehiclesSnapshot.forEach((doc) => {
    vehicles.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Vehículos del usuario ${userId}:`, vehicles); // Depuración
  return vehicles;
};

// Función para cargar y mostrar usuarios con sus vehículos
const loadUsers = async () => {
  try {
    const users = await getAllUsers();

    await Promise.all(users.map(async (user) => {
      const userId = user.id;
      const userEmail = user.email;
      const displayName = user.displayName || "Sin nombre";

      // Obtener vehículos del usuario
      const vehicles = await getUserVehicles(userId);

      // Crear tarjeta de usuario
      const userCard = document.createElement("div");
      userCard.className = "user-card";
      userCard.innerHTML = `
        <h5>${userEmail}</h5>
        <p><strong>Nombre:</strong> ${displayName}</p>
        <p><strong>ID:</strong> ${userId}</p>
        <div class="vehicle-list">
          <h6>Vehículos:</h6>
          ${vehicles.length > 0
            ? vehicles.map(vehicle => `
              <div class="vehicle-item">
                <p><strong>Marca:</strong> ${vehicle.brand}</p>
                <p><strong>Modelo:</strong> ${vehicle.model}</p>
                <p><strong>Placa:</strong> ${vehicle.licence}</p>
                <p><strong>Año:</strong> ${vehicle.year}</p>
              </div>
            `).join("")
            : "<p>No hay vehículos registrados.</p>"
          }
        </div>
      `;
      usersList.appendChild(userCard);
    }));
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
  }
};

// Cargar usuarios al iniciar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(user.uid);
    if (admin) {
      loadUsers(); // Cargar usuarios si es administrador
    } else {
      alert("No tienes permisos para acceder a esta página.");
      window.location.href = "/profile"; // Redirigir a otra página
    }
  } else {
    window.location.href = "/login"; // Redirigir si no está autenticado
  }
});