// auth.js
import { auth } from "./firebase_config.js"; // Importa desde el archivo local
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Función para iniciar sesión
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("Formulario de inicio de sesión enviado");

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario autenticado:", userCredential.user);

    // Obtén el token de Firebase (opcional, si lo necesitas para el backend)
    const token = await userCredential.user.getIdToken();
    console.log("Token de Firebase:", token);

    // Redirige al usuario después del inicio de sesión
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    alert(`Error: ${error.message}`);
  }
});

// Función para registrarse
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("Formulario de registro enviado");

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const displayName = document.getElementById('displayName').value;

  try {
    // Crea el usuario con correo y contraseña
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Usuario registrado:", userCredential.user);

    // Actualiza el perfil del usuario con el nombre
    await updateProfile(userCredential.user, {
      displayName: displayName,
    });
    console.log("Perfil actualizado con el nombre:", displayName);

    alert("Registro exitoso");
    window.location.href = "/login"; // Redirige al usuario a la página de inicio de sesión
  } catch (error) {
    console.error("Error en el registro:", error);
    alert(`Error: ${error.message}`);
  }
});