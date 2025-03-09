import { auth } from "./firebase_config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Función para iniciar sesión
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    alert("Inicio de sesión exitoso");
    window.location.href = "/profile";  // Redirigir al dashboard
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// Función para registrarse
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const displayName = document.getElementById('displayName').value; // Obtener el nombre

  try {
    // Crear usuario con correo y contraseña
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Actualizar el perfil del usuario con el nombre
    await updateProfile(userCredential.user, {
      displayName: displayName, // Asignar el nombre
    });

    alert("Registro exitoso");
    window.location.href = "/dashboard";  // Redirigir al dashboard
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});