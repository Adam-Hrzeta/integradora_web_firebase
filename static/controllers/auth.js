import { auth, db } from "../firebase_config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Función para mostrar/ocultar la contraseña
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling;
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility";
  } else {
    input.type = "password";
    icon.textContent = "visibility_off";
  }
}

// Asignar eventos a los íconos de ojo
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", () => {
    const inputId = icon.parentElement.querySelector("input").id;
    togglePassword(inputId);
  });
});

// Función para iniciar sesión
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Formulario de inicio de sesión enviado");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario autenticado:", userCredential.user);

    // Redirige al usuario después del inicio de sesión
    window.location.href = "/profile";
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    alert(`Error: ${error.message}`);
  }
});

// Función para registrarse
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Formulario de registro enviado");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const displayName = document.getElementById("displayName").value;

  try {
    // Crea el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario registrado:", user);

    // Actualiza el perfil del usuario con el nombre
    await updateProfile(user, {
      displayName: displayName,
    });
    console.log("Perfil actualizado con el nombre:", displayName);

    // Guarda los datos del usuario en Firestore con el rol de "admin"
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: displayName,
      role: "admin", // Asignar el rol de administrador
      createdAt: new Date(),
    });
    console.log("Usuario guardado en Firestore con rol de admin:", user.uid);

    alert("Registro exitoso");
    window.location.href = "/login"; // Redirige al usuario a la página de inicio de sesión
  } catch (error) {
    console.error("Error en el registro:", error);
    alert(`Error: ${error.message}`);
  }
});