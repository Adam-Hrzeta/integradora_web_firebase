import { auth } from "../firebase_config.js";
import {
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Referencias a elementos del DOM
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const messageList = document.getElementById("messageList");
const allMessagesBtn = document.getElementById("allMessagesBtn");
const unreadMessagesBtn = document.getElementById("unreadMessagesBtn");

// Variable para controlar el filtro actual
let currentFilter = "all";

// Función para formatear la fecha
function formatDate(timestamp) {
    if (!timestamp) return "Fecha no disponible";
    try {
        const date = timestamp.toDate();
        return date.toLocaleString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (error) {
        console.error("Error al formatear fecha:", error);
        return "Fecha no disponible";
    }
}

// Función para verificar si el usuario es administrador
const isAdmin = async (userId) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === "admin";
    }
    return false;
};

// Función para crear un elemento de mensaje
function createMessageElement(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message-item";
    
    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";
    
    const userInfo = document.createElement("span");
    userInfo.className = "user-info";
    userInfo.textContent = `Usuario: ${message.userEmail}`;
    
    const date = document.createElement("span");
    date.textContent = formatDate(message.timestamp);
    
    messageHeader.appendChild(userInfo);
    messageHeader.appendChild(date);
    
    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = message.message;
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(content);

    // Agregar formulario de respuesta si el mensaje no tiene respuesta
    if (!message.response) {
        const responseForm = document.createElement("div");
        responseForm.className = "response-form";
        
        const responseInput = document.createElement("textarea");
        responseInput.className = "response-input";
        responseInput.placeholder = "Escribe tu respuesta aquí...";
        
        const sendResponseBtn = document.createElement("button");
        sendResponseBtn.className = "send-response-btn";
        sendResponseBtn.innerHTML = '<i class="material-icons">send</i> Enviar Respuesta';
        
        sendResponseBtn.addEventListener("click", async () => {
            const response = responseInput.value.trim();
            if (response) {
                try {
                    await updateDoc(doc(db, "messages", message.id), {
                        response: response,
                        responseTimestamp: serverTimestamp(),
                        read: true
                    });
                    responseInput.value = "";
                } catch (error) {
                    console.error("Error al enviar respuesta:", error);
                    alert("Error al enviar la respuesta. Por favor, inténtalo de nuevo.");
                }
            }
        });
        
        responseForm.appendChild(responseInput);
        responseForm.appendChild(sendResponseBtn);
        messageDiv.appendChild(responseForm);
    } else {
        // Mostrar la respuesta existente
        const responseDiv = document.createElement("div");
        responseDiv.className = "response-form";
        responseDiv.innerHTML = `
            <p class="message-content"><strong>Respuesta:</strong> ${message.response}</p>
            <small style="color: #c5cae9;">Respondido el ${formatDate(message.responseTimestamp)}</small>
        `;
        messageDiv.appendChild(responseDiv);
    }
    
    return messageDiv;
}

// Función para cargar mensajes
function loadMessages(filter = "all") {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        messageList.innerHTML = "";
        snapshot.forEach((doc) => {
            const message = { id: doc.id, ...doc.data() };
            // Mostrar todos los mensajes que vienen de la aplicación móvil
            if (message.userId && message.userEmail) {
                if (filter === "all" || (filter === "unread" && !message.read)) {
                    messageList.appendChild(createMessageElement(message));
                }
            }
        });
    });
}

// Función para enviar mensaje
async function sendMessage(userId, userEmail) {
    const message = messageInput.value.trim();
    if (!message) return;
    
    try {
        await addDoc(collection(db, "messages"), {
            userId: userId,
            userEmail: userEmail,
            message: message,
            fromAdmin: false,
            timestamp: serverTimestamp(),
            read: false
        });
        messageInput.value = "";
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
    }
}

// Event Listeners
if (sendMessageButton && messageInput) {
    sendMessageButton.addEventListener("click", () => {
        const user = auth.currentUser;
        if (user) {
            sendMessage(user.uid, user.email);
        }
    });

    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessageButton.click();
        }
    });
}

// Event Listeners para los filtros
if (allMessagesBtn && unreadMessagesBtn) {
    allMessagesBtn.addEventListener("click", () => {
        currentFilter = "all";
        allMessagesBtn.classList.add("active");
        unreadMessagesBtn.classList.remove("active");
        loadMessages("all");
    });

    unreadMessagesBtn.addEventListener("click", () => {
        currentFilter = "unread";
        unreadMessagesBtn.classList.add("active");
        allMessagesBtn.classList.remove("active");
        loadMessages("unread");
    });
}

// Verificar autenticación y cargar mensajes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verificar si el usuario es administrador
        const admin = await isAdmin(user.uid);
        if (admin) {
            loadMessages(currentFilter);
        } else {
            alert("No tienes permisos para acceder a esta página.");
            window.location.href = "/profile";
        }
    } else {
        window.location.href = "/login";
    }
}); 