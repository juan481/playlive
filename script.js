// Configuración de Firebase (reemplaza con tu configuración de Firebase Console)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpIultm2eL35OVTPMhVU0w6hAA8WrEFec",
  authDomain: "playlive-2690b.firebaseapp.com",
  projectId: "playlive-2690b",
  storageBucket: "playlive-2690b.firebasestorage.app",
  messagingSenderId: "395324082764",
  appId: "1:395324082764:web:97fd9c7ff149d8bd0242e9",
  measurementId: "G-N710DED5DX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// AWS IVS para jugadores (página index.html)
if (document.getElementById('player')) {
  if (IVSPlayer.isPlayerSupported) {
    const player = IVSPlayer.create();
    player.attachHTMLVideoElement(document.getElementById('player'));
    player.setAutoplay(true);
    player.load('TU_PLAYBACK_URL'); // Reemplaza con tu Playback URL de AWS IVS
    player.play();
  }
}

// AWS IVS para admin (página admin.html)
let client;
function startBroadcast() {
  client = IVSBroadcastClient.create({
    streamConfig: IVSBroadcastClient.BASIC_FULL_HD,
    ingestEndpoint: 'TU_INGEST_ENDPOINT' // Reemplaza con tu Ingest Endpoint de AWS IVS
  });
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    client.attachMediaStream(stream);
    client.startBroadcast('TU_STREAM_KEY'); // Reemplaza con tu Stream Key
    document.getElementById('broadcast').srcObject = stream;
  }).catch(error => alert('Error al iniciar transmisión: ' + error.message));
}

function stopBroadcast() {
  if (client) {
    client.stopBroadcast();
    document.getElementById('broadcast').srcObject = null;
  }
}