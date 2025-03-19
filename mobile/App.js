import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx",
  authDomain: "integradora-adam.firebaseapp.com",
  projectId: "integradora-adam",
  storageBucket: "integradora-adam.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Stack = createNativeStackNavigator();

// Componente Login
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verificar si el usuario es admin
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
      const userData = userDoc.docs[0]?.data();
      
      if (userData?.isAdmin) {
        navigation.replace("AdminDashboard");
      } else {
        navigation.replace("UserDashboard");
      }
    } catch (error) {
      Alert.alert("Error", "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Componente MessagesScreen
const MessagesScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Obtener mensajes del usuario
        const messagesRef = collection(db, "messages");
        const q = query(messagesRef, where("userId", "==", user.uid));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messagesData.sort((a, b) => b.timestamp - a.timestamp));
          setLoading(false);
        });
        return () => unsubscribeMessages();
      } else {
        navigation.replace("Login");
      }
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Error", "Por favor, escriba un mensaje");
      return;
    }

    try {
      const messagesRef = collection(db, "messages");
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        read: false,
        fromAdmin: false
      });
      setNewMessage("");
    } catch (error) {
      Alert.alert("Error", "Error al enviar el mensaje");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7e57c2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mensajes</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageItem,
            item.fromAdmin ? styles.adminMessage : styles.userMessage
          ]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageDate}>
              {item.timestamp?.toDate().toLocaleString()}
            </Text>
          </View>
        )}
      />
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Escriba su mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente UserDashboard
const UserDashboard = ({ navigation }) => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Obtener parkings
        const parkingsRef = collection(db, "parkings");
        const unsubscribeParkings = onSnapshot(parkingsRef, (snapshot) => {
          const parkingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setParkings(parkingsData);
          setLoading(false);
        });
        return () => unsubscribeParkings();
      } else {
        navigation.replace("Login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7e57c2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, {user?.email}</Text>
      <FlatList
        data={parkings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.parkingItem}>
            <Text style={styles.parkingName}>{item.name}</Text>
            <Text style={[
              styles.parkingStatus,
              item.status === "libre" && styles.statusLibre,
              item.status === "ocupado" && styles.statusOcupado,
              item.status === "servicio" && styles.statusServicio
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity 
        style={[styles.button, { marginBottom: 10 }]} 
        onPress={() => navigation.navigate("Messages")}
      >
        <Text style={styles.buttonText}>Mensajes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente AdminDashboard
const AdminDashboard = ({ navigation }) => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Obtener parkings
        const parkingsRef = collection(db, "parkings");
        const unsubscribeParkings = onSnapshot(parkingsRef, (snapshot) => {
          const parkingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setParkings(parkingsData);
          setLoading(false);
        });
        return () => unsubscribeParkings();
      } else {
        navigation.replace("Login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (parkingId, newStatus) => {
    try {
      const parkingRef = doc(db, "parkings", parkingId);
      await updateDoc(parkingRef, { status: newStatus });
    } catch (error) {
      Alert.alert("Error", "Error al actualizar el estado");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7e57c2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>
      <FlatList
        data={parkings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.parkingItem}>
            <Text style={styles.parkingName}>{item.name}</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "libre" && styles.statusButtonActive]}
                onPress={() => handleStatusChange(item.id, "libre")}
              >
                <Text style={styles.statusButtonText}>Libre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "ocupado" && styles.statusButtonActive]}
                onPress={() => handleStatusChange(item.id, "ocupado")}
              >
                <Text style={styles.statusButtonText}>Ocupado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, item.status === "servicio" && styles.statusButtonActive]}
                onPress={() => handleStatusChange(item.id, "servicio")}
              >
                <Text style={styles.statusButtonText}>Servicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#7e57c2",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  parkingItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  parkingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: "bold",
  },
  statusLibre: {
    backgroundColor: "#4caf50",
    color: "#fff",
  },
  statusOcupado: {
    backgroundColor: "#f44336",
    color: "#fff",
  },
  statusServicio: {
    backgroundColor: "#ff9800",
    color: "#fff",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 5,
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
  },
  statusButtonActive: {
    backgroundColor: "#7e57c2",
  },
  statusButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#7e57c2",
    alignSelf: "flex-end",
  },
  adminMessage: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  messageDate: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
  messageInputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#7e57c2",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} options={{ title: "Panel de Usuario" }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: "Panel de Administración" }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Mensajes" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 