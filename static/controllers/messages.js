import { auth, db } from "../firebase_config.js";
import {
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    where,
    getDocs,
    writeBatch,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Referencias a elementos del DOM
const chatsList = document.getElementById("chatsList");
const chatMessages = document.getElementById("chatMessages");
const selectedChatTitle = document.getElementById("selectedChatTitle");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");

// Variables globales
let currentChat = null;
let chats = new Map();

// Función para formatear la fecha
function formatDate(timestamp) {
    if (!timestamp) return "Fecha no disponible";
    try {
        const date = timestamp.toDate();
        return date.toLocaleString("es-ES", {
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

// Función para crear un elemento de chat
function createChatElement(chat) {
    const chatDiv = document.createElement("div");
    chatDiv.className = "chat-item";
    if (currentChat?.userId === chat.userId) {
        chatDiv.classList.add("active");
    }

    const unreadCount = chat.unreadCount > 0 ? `<span class="unread-badge">${chat.unreadCount}</span>` : '';
    
    chatDiv.innerHTML = `
        <div class="chat-item-header">
            <span class="chat-item-email">${chat.userEmail}</span>
            <span class="chat-item-time">${formatDate(chat.lastMessage?.timestamp)}</span>
        </div>
        <div class="chat-item-preview">
            ${chat.lastMessage?.message || 'No hay mensajes'} ${unreadCount}
        </div>
    `;

    chatDiv.addEventListener("click", () => selectChat(chat));
    return chatDiv;
}

// Función para crear un elemento de mensaje
function createMessageElement(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message-item ${message.fromAdmin ? 'user-message' : 'admin-message'}`;
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    
    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = message.message;
    
    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatDate(message.timestamp);
    
    bubble.appendChild(content);
    bubble.appendChild(time);
    messageDiv.appendChild(bubble);
    
    return messageDiv;
}

// Función para seleccionar un chat
function selectChat(chat) {
    currentChat = chat;
    selectedChatTitle.textContent = `Chat con ${chat.userEmail}`;
    
    // Actualizar la lista de chats
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('.chat-item-email').textContent === chat.userEmail) {
            item.classList.add('active');
        }
    });
    
    // Mostrar los mensajes del chat
    displayChatMessages(chat.messages);
    
    // Marcar mensajes como leídos
    markChatAsRead(chat.userId);
}

// Función para mostrar los mensajes de un chat
function displayChatMessages(messages) {
    chatMessages.innerHTML = '';
    messages.forEach(message => {
        chatMessages.appendChild(createMessageElement(message));
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para marcar mensajes como leídos
async function markChatAsRead(userId) {
    try {
        const messagesRef = collection(db, "messages");
        const q = query(messagesRef, where("userId", "==", userId), where("read", "==", false));
        
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error al marcar mensajes como leídos:", error);
    }
}

// Función para enviar mensaje
async function sendMessage() {
    if (!currentChat || !messageInput.value.trim()) return;

    try {
        await addDoc(collection(db, "messages"), {
            message: messageInput.value.trim(),
            timestamp: serverTimestamp(),
            fromAdmin: true,
            userId: currentChat.userId,
            userEmail: currentChat.userEmail
        });
        messageInput.value = "";
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
    }
}

// Función para cargar chats
function loadChats() {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    onSnapshot(q, (snapshot) => {
        chats.clear();
        
        snapshot.forEach((doc) => {
            const message = { id: doc.id, ...doc.data() };
            if (message.userId && message.userEmail) {
                if (!chats.has(message.userId)) {
                    chats.set(message.userId, {
                        userId: message.userId,
                        userEmail: message.userEmail,
                        messages: [],
                        lastMessage: message,
                        unreadCount: 0
                    });
                }
                
                const chat = chats.get(message.userId);
                chat.messages.push(message);
                if (!message.read && !message.fromAdmin) {
                    chat.unreadCount++;
                }
                if (!chat.lastMessage || message.timestamp > chat.lastMessage.timestamp) {
                    chat.lastMessage = message;
                }
            }
        });
        
        // Actualizar la lista de chats
        chatsList.innerHTML = '';
        Array.from(chats.values())
            .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
            .forEach(chat => {
                chatsList.appendChild(createChatElement(chat));
            });
        
        // Si hay un chat seleccionado, actualizar sus mensajes
        if (currentChat) {
            const updatedChat = chats.get(currentChat.userId);
            if (updatedChat) {
                displayChatMessages(updatedChat.messages);
            }
        }
    });
}

// Event Listeners
if (sendMessageButton && messageInput) {
    sendMessageButton.addEventListener("click", sendMessage);
    
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Verificar autenticación y cargar chats
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verificar si el usuario es administrador
        const admin = await isAdmin(user.uid);
        if (admin) {
            loadChats();
        } else {
            alert("No tienes permisos para acceder a esta página.");
            window.location.href = "/profile";
        }
    } else {
        window.location.href = "/login";
    }
}); 