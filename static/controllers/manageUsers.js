import { auth, db } from "../firebase_config.js";
import { onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Referencia a la lista de usuarios en el DOM
const usersList = document.getElementById("usersList");

// Función para verificar si el usuario es administrador
const isAdmin = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.role === "admin";
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
    const userData = doc.data();
    // Solo incluir usuarios que no sean admin
    if (userData.role !== "admin") {
      users.push({ id: doc.id, ...userData });
    }
  });

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

  return vehicles;
};

// Función para eliminar un usuario y sus datos asociados
const deleteUserAndData = async (userId, userEmail) => {
  if (confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
    try {
      // Eliminar vehículos del usuario
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(vehiclesRef, where("userId", "==", userId));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const deleteVehiclePromises = vehiclesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteVehiclePromises);

      // Eliminar mensajes del usuario
      const messagesRef = collection(db, "messages");
      const messagesQuery = query(messagesRef, where("userId", "==", userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagePromises);

      // Eliminar documento del usuario en Firestore
      await deleteDoc(doc(db, "users", userId));

      // Eliminar la cuenta de autenticación
      const user = auth.currentUser;
      if (user.email === userEmail) {
        await deleteUser(user);
      }

      alert("Usuario eliminado correctamente");
      loadUsers(); // Recargar la lista de usuarios
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar el usuario. Asegúrate de tener los permisos necesarios.");
    }
  }
};

// Función para cargar y mostrar usuarios con sus vehículos
const loadUsers = async () => {
  try {
    const users = await getAllUsers();
    usersList.innerHTML = ""; // Limpiar la lista actual

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
        <h5>${displayName}</h5>
        <div class="vehicle-list">
          <h6>Vehículos Registrados:</h6>
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
        <div class="user-actions">
          <button class="action-btn delete-btn" onclick="window.deleteUserAndData('${userId}', '${userEmail}')">
            <i class="material-icons">delete</i> Eliminar
          </button>
        </div>
      `;
      usersList.appendChild(userCard);
    }));
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
  }
};

// Hacer las funciones disponibles globalmente
window.deleteUserAndData = deleteUserAndData;

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