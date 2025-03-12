import { auth, storage } from "./firebase_config.js";
import { 
  onAuthStateChanged, 
  signOut, 
  updatePassword, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Referencias a elementos del DOM
const profileImage = document.getElementById("profileImage");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const signOutButton = document.getElementById("signOutButton");
const editNameButton = document.getElementById("editNameButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const editProfileImageButton = document.getElementById("editProfileImage");

// Modales
const editNameModal = document.getElementById("editNameModal");
const changePasswordModal = document.getElementById("changePasswordModal");
const changeProfileImageModal = document.getElementById("changeProfileImageModal");

// Cerrar modales
document.querySelectorAll(".close").forEach(button => {
  button.addEventListener("click", () => {
    editNameModal.style.display = "none";
    changePasswordModal.style.display = "none";
    changeProfileImageModal.style.display = "none";
  });
});

// Abrir modales
editNameButton.addEventListener("click", () => editNameModal.style.display = "flex");
changePasswordButton.addEventListener("click", () => changePasswordModal.style.display = "flex");
editProfileImageButton.addEventListener("click", () => changeProfileImageModal.style.display = "flex");

// Guardar nuevo nombre
document.getElementById("saveNameButton").addEventListener("click", async () => {
  const newName = document.getElementById("newUserName").value;
  if (newName) {
    await updateProfile(auth.currentUser, { displayName: newName });
    userName.textContent = newName;
    editNameModal.style.display = "none";
  }
});

// Guardar nueva contraseña
document.getElementById("savePasswordButton").addEventListener("click", async () => {
  const newPassword = document.getElementById("newPassword").value;
  if (newPassword) {
    await updatePassword(auth.currentUser, newPassword);
    alert("Contraseña actualizada correctamente");
    changePasswordModal.style.display = "none";
  }
});

document.getElementById("saveProfileImageButton").addEventListener("click", async () => {
  const fileInput = document.getElementById("profileImageInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecciona una imagen primero.");
    return;
  }

  if (!auth.currentUser) {
    alert("Usuario no autenticado.");
    return;
  }

  try {
    console.log("Subiendo imagen:", file.name);
    const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
    
    // Subir la imagen
    await uploadBytes(storageRef, file);
    console.log("Imagen subida con éxito.");

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    console.log("URL de la imagen:", downloadURL);

    // Actualizar perfil del usuario
    await updateProfile(auth.currentUser, { photoURL: downloadURL });

    // Actualizar imagen en el perfil
    profileImage.src = `${downloadURL}?t=${new Date().getTime()}`;

    // Cerrar modal
    changeProfileImageModal.style.display = "none";
    alert("Imagen actualizada correctamente.");
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    alert("Error al subir la imagen. Revisa la consola.");
  }
});


// Cerrar sesión
signOutButton.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "/login");
});

// Escuchar cambios en la autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    userName.textContent = user.displayName || "Sin nombre";
    userEmail.textContent = user.email;
    profileImage.src = user.photoURL || "https://via.placeholder.com/100";
  } else {
    window.location.href = "/profile";
  }
});
