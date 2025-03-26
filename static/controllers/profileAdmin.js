import { auth, db } from "../firebase_config.js";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Referencias a elementos del DOM
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const signOutButton = document.getElementById("signOutButton");
const editNameButton = document.getElementById("editNameButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const parkingsList = document.getElementById("parkingsList");
const addParkingButton = document.getElementById("addParkingButton");

// Cargar modales dinámicamente
async function loadModals() {
    const modalsContainer = document.getElementById("modals-container");

    const modalFiles = [
        "static/components/modals/editNameModal.html",
        "static/components/modals/changePasswordModal.html",
        "static/components/modals/addParkingModal.html",
    ];

    for (const file of modalFiles) {
        const response = await fetch(file);
        const html = await response.text();
        modalsContainer.innerHTML += html;
    }
}

// Inicializar modales
loadModals().then(() => {
    console.log("Modales cargados correctamente");

    // Referencias a los modales después de cargarlos
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
        document.getElementById("oldPassword").value = ""; // Limpiar el input
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
        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            alert("Las nuevas contraseñas no coinciden. Inténtalo de nuevo.");
            return;
        }

        if (!oldPassword) {
            alert("Debes ingresar la contraseña anterior.");
            return;
        }

        try {
            // Verificar la contraseña anterior
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Cambiar la contraseña
            await updatePassword(user, newPassword);
            alert("Contraseña actualizada correctamente");
            changePasswordModal.style.display = "none";
        } catch (error) {
            console.error("Error al actualizar la contraseña:", error);
            alert("Error al actualizar la contraseña. Verifica la contraseña anterior e inténtalo de nuevo.");
        }
    });

    // Agregar nuevo parking
    document.getElementById("saveParkingButton").addEventListener("click", async () => {
        const label = document.getElementById("newParkingLabel").value;
        const status = "libre"; // Default status
        const device = "arduino"; // Default device

        if (label) {
            try {
                await addDoc(collection(db, "parkings"), { label, status, device });
                alert("Parking agregado correctamente");
                addParkingModal.style.display = "none";
            } catch (error) {
                console.error("Error al agregar el parking:", error);
                alert("Error al agregar el parking. Inténtalo de nuevo.");
            }
        } else {
            alert("Debes ingresar un nombre para el parking.");
        }
    });
});

// Función para verificar si el usuario es administrador
const isAdmin = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.role === "admin";
  }
  return false;
};

// Inicializar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(user.uid);
    if (admin) {
      // Cargar datos del perfil
      userName.textContent = user.displayName || "Administrador";
      userEmail.textContent = user.email;
    } else {
      alert("No tienes permisos para acceder a esta página.");
      window.location.href = "/profile";
    }
  } else {
    window.location.href = "/login";
  }
});

// Event listeners para los botones
signOutButton.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/login";
  });
});

document.getElementById("manageUsers").addEventListener("click", () => {
  window.location.href = "/manageUsers";
});

document.getElementById("messagesButton").addEventListener("click", () => {
  window.location.href = "/messages";
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

// Inicializar
getParkings();