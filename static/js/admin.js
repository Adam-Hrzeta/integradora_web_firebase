import { auth } from "/static/js/firebase_config.js";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Referencias a elementos del DOM
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const signOutButton = document.getElementById("signOutButton");
const editNameButton = document.getElementById("editNameButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const parkingsList = document.getElementById("parkingsList");
const addParkingButton = document.getElementById("addParkingButton");

// Modales
const editNameModal = document.getElementById("editNameModal");
const changePasswordModal = document.getElementById("changePasswordModal");
const addParkingModal = document.getElementById("addParkingModal");

// Cerrar modales al hacer clic fuera de ellos
window.addEventListener("click", (event) => {
  if (event.target === editNameModal) {
    editNameModal.style.display = "none";
  }
  if (event.target === changePasswordModal) {
    changePasswordModal.style.display = "none";
  }
  if (event.target === addParkingModal) {
    addParkingModal.style.display = "none";
  }
});

// Botones de cancelar
document.getElementById("cancelNameButton").addEventListener("click", () => {
  editNameModal.style.display = "none";
});

document.getElementById("cancelPasswordButton").addEventListener("click", () => {
  changePasswordModal.style.display = "none";
});

document.getElementById("cancelParkingButton").addEventListener("click", () => {
  addParkingModal.style.display = "none";
});

// Abrir modal de editar nombre
editNameButton.addEventListener("click", () => {
  document.getElementById("newUserName").value = ""; // Limpiar el input
  editNameModal.style.display = "block";
});

// Abrir modal de cambiar contraseña
changePasswordButton.addEventListener("click", () => {
  document.getElementById("newPassword").value = ""; // Limpiar el input
  document.getElementById("confirmPassword").value = ""; // Limpiar el input
  changePasswordModal.style.display = "block";
});

// Abrir modal de agregar parking
addParkingButton.addEventListener("click", () => {
  addParkingModal.style.display = "block";
});

// Mostrar/ocultar contraseña
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.textContent = "visibility";
    } else {
      input.type = "password";
      icon.textContent = "visibility_off";
    }
  });
});

// Guardar nuevo nombre
document.getElementById("saveNameButton").addEventListener("click", async () => {
  const newName = document.getElementById("newUserName").value;
  if (newName) {
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      userName.textContent = newName;
      editNameModal.style.display = "none";
    } catch (error) {
      console.error("Error al actualizar el nombre:", error);
      alert("Error al actualizar el nombre. Inténtalo de nuevo.");
    }
  }
});

// Guardar nueva contraseña
document.getElementById("savePasswordButton").addEventListener("click", async () => {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    alert("Las contraseñas no coinciden. Inténtalo de nuevo.");
    return;
  }

  if (newPassword) {
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert("Contraseña actualizada correctamente");
      changePasswordModal.style.display = "none";
    } catch (error) {
      console.error("Error al actualizar la contraseña:", error);
      alert("Error al actualizar la contraseña. Inténtalo de nuevo.");
    }
  }
});

// Cerrar sesión
signOutButton.addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "/login"));
});

// Escuchar cambios en la autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado:", user);
    userName.textContent = user.displayName || "Sin nombre";
    userEmail.textContent = user.email || "Sin correo";
  } else {
    console.log("Usuario no autenticado. Redirigiendo...");
    window.location.href = "/login";
  }
});

// Obtener parkings
const getParkings = () => {
  const q = query(collection(db, "parkings"));
  onSnapshot(q, (snapshot) => {
    parkingsList.innerHTML = ""; // Limpiar lista
    snapshot.forEach((doc) => {
      const parking = doc.data();
      const parkingItem = document.createElement("div");
      parkingItem.className = "parking-item";

      // Mostrar nombre y estado del parking
      parkingItem.innerHTML = `
        <span>${parking.label}</span>
        <span class="parking-status ${parking.status}">${parking.status}</span>
        <div>
          <button onclick="updateParkingStatus('${doc.id}', 'libre')" class="btn-small green">Disponible</button>
          <button onclick="updateParkingStatus('${doc.id}', 'ocupado')" class="btn-small red">Ocupado</button>
          <button onclick="updateParkingStatus('${doc.id}', 'servicio')" class="btn-small orange">En Servicio</button>
          <button onclick="deleteParking('${doc.id}')" class="btn-small grey">Eliminar</button>
        </div>
      `;
      parkingsList.appendChild(parkingItem);
    });
  });
};

// Actualizar estado del parking
window.updateParkingStatus = async (parkingId, status) => {
  try {
    await updateDoc(doc(db, "parkings", parkingId), { status });
    alert("Estado del parking actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar el estado del parking:", error);
    alert("Error al actualizar el estado del parking. Inténtalo de nuevo.");
  }
};

// Eliminar parking
window.deleteParking = async (parkingId) => {
  if (confirm("¿Estás seguro de eliminar este parking?")) {
    try {
      await deleteDoc(doc(db, "parkings", parkingId));
      alert("Parking eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el parking:", error);
      alert("Error al eliminar el parking. Inténtalo de nuevo.");
    }
  }
};

// Agregar nuevo parking
document.getElementById("saveParkingButton").addEventListener("click", async () => {
  const label = document.getElementById("newParkingLabel").value;
  const status = document.getElementById("newParkingStatus").value;
  if (label && status) {
    try {
      await addDoc(collection(db, "parkings"), { label, status });
      alert("Parking agregado correctamente");
      addParkingModal.style.display = "none";
    } catch (error) {
      console.error("Error al agregar el parking:", error);
      alert("Error al agregar el parking. Inténtalo de nuevo.");
    }
  }
});

// Inicializar
getParkings();