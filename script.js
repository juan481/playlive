// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpIultm2eL35OVTPMhVU0w6hAA8WrEFec",
  authDomain: "playlive-2690b.firebaseapp.com",
  projectId: "playlive-2690b",
  storageBucket: "playlive-2690b.firebasestorage.app",
  messagingSenderId: "395324082764",
  appId: "1:395324082764:web:97fd9c7ff149d8bd0242e9",
  measurementId: "G-N710DED5DX"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Funciones globales para el panel de admin
window.startStream = function () {
  const urlInput = document.getElementById('stream-url');
  if (urlInput && urlInput.value.trim()) {
    db.collection('stream').doc('current').set({ url: urlInput.value.trim() })
      .then(() => alert('Stream iniciado'))
      .catch(error => alert('Error al iniciar stream: ' + error.message));
  } else {
    alert('Ingresa una URL válida de OBS Ninja');
  }
};

window.stopStream = function () {
  db.collection('stream').doc('current').delete()
    .then(() => {
      db.collection('eventoActual').doc('current').update({ preguntaActiva: false })
        .catch(() => console.log('No había pregunta activa para desactivar'));
      alert('Stream detenido');
    })
    .catch(error => alert('Error al detener stream: ' + error.message));
};

window.setNextEvent = function () {
  const nextEventTime = document.getElementById('next-event-time');
  if (nextEventTime && nextEventTime.value) {
    const timestamp = new Date(nextEventTime.value).getTime();
    db.collection('stream').doc('next').set({ timestamp })
      .then(() => alert('Próximo evento establecido'))
      .catch(error => alert('Error al establecer próximo evento: ' + error.message));
  } else {
    alert('Selecciona una fecha y hora válidas');
  }
};

window.sendQuestion = function () {
  const questionInput = document.getElementById('question-input');
  const answer1 = document.getElementById('answer1');
  const answer2 = document.getElementById('answer2');
  const answer3 = document.getElementById('answer3');
  const answer4 = document.getElementById('answer4');
  const correctAnswer = document.querySelector('input[name="correct-answer"]:checked');

  if (!questionInput || !answer1 || !answer2 || !answer3 || !answer4 || !correctAnswer) {
    alert('Error: Faltan campos en el formulario');
    return;
  }

  const question = questionInput.value.trim();
  const answers = [
    answer1.value.trim(),
    answer2.value.trim(),
    answer3.value.trim(),
    answer4.value.trim()
  ];
  const correctAnswerIndex = parseInt(correctAnswer.value);
  const start_time = Date.now();
  const duration = 10000;

  if (question && answers.every(ans => ans)) {
    db.collection('eventoActual').doc('current').set({
      preguntaActiva: true,
      question,
      answers,
      correctAnswer: correctAnswerIndex,
      start_time,
      duration
    }).then(() => {
      questionInput.value = '';
      answer1.value = '';
      answer2.value = '';
      answer3.value = '';
      answer4.value = '';
      document.querySelector('input[name="correct-answer"][value="0"]').checked = true;
      alert('Pregunta enviada');
    }).catch(error => alert('Error al enviar pregunta: ' + error.message));
  } else {
    alert('Completa todos los campos de la pregunta');
  }
};

window.sendChatMessage = function () {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) {
    console.error('Input de chat no encontrado');
    alert('Error: No se encontró el campo de mensaje');
    return;
  }
  if (!auth.currentUser) {
    console.warn('Usuario no autenticado al intentar enviar mensaje');
    alert('Por favor, inicia sesión para enviar mensajes');
    return;
  }
  if (chatInput.value.trim()) {
    const message = chatInput.value.trim().substring(0, 100);
    const timestamp = Date.now();
    const userId = auth.currentUser.uid;
    db.collection('chat').add({
      message,
      userId,
      timestamp,
      displayName: auth.currentUser.displayName || 'Anónimo'
    }).then(() => {
      chatInput.value = '';
    }).catch(error => alert('Error al enviar mensaje: ' + error.message));
  } else {
    alert('Escribe un mensaje antes de enviar');
  }
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const mainScreen = document.getElementById('main-screen');
  const googleLogin = document.getElementById('google-login');
  const logoutButton = document.getElementById('logout-button');
  const profileName = document.getElementById('profile-name');
  const profilePicture = document.getElementById('profile-picture');
  const navItems = document.querySelectorAll('.md-navigation-tab');
  const editProfileButton = document.getElementById('edit-profile');
  const saveProfileButton = document.getElementById('save-profile');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileEmail = document.getElementById('profile-email');
  const profileCbu = document.getElementById('profile-cbu');
  const profileWhatsapp = document.getElementById('profile-whatsapp');
  const profileBio = document.getElementById('profile-bio');
  const chatToggle = document.getElementById('chat-toggle');

  const provider = new firebase.auth.GoogleAuthProvider();

  // Configurar login con Google
  if (googleLogin) {
    googleLogin.addEventListener('click', () => {
      auth.signInWithPopup(provider)
        .then(result => {
          console.log('Usuario autenticado:', result.user.uid);
          if (loginScreen && mainScreen) {
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            switchTab('tab-live');
          }
        })
        .catch(error => alert('Error al iniciar sesión: ' + error.message));
    });
  }

  // Configurar logout
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      auth.signOut()
        .then(() => console.log('Sesión cerrada'))
        .catch(error => alert('Error al cerrar sesión: ' + error.message));
    });
  }

  // Configurar edición de perfil
  if (editProfileButton && saveProfileButton) {
    editProfileButton.addEventListener('click', () => {
      profileDisplayName.disabled = false;
      profileCbu.disabled = false;
      profileWhatsapp.disabled = false;
      profileBio.disabled = false;
      editProfileButton.classList.add('hidden');
      saveProfileButton.classList.remove('hidden');
    });

    saveProfileButton.addEventListener('click', () => {
      if (auth.currentUser) {
        const userData = {
          displayName: profileDisplayName.value.trim() || auth.currentUser.displayName || 'Anónimo',
          cbu: profileCbu.value.trim(),
          whatsapp: profileWhatsapp.value.trim(),
          bio: profileBio.value.trim()
        };
        db.collection('users').doc(auth.currentUser.uid).set(userData, { merge: true })
          .then(() => {
            profileDisplayName.disabled = true;
            profileCbu.disabled = true;
            profileWhatsapp.disabled = true;
            profileBio.disabled = true;
            editProfileButton.classList.remove('hidden');
            saveProfileButton.classList.add('hidden');
            alert('Perfil actualizado');
          })
          .catch(error => alert('Error al actualizar perfil: ' + error.message));
      }
    });
  }

  // Configurar toggle de chat
  if (chatToggle) {
    chatToggle.addEventListener('change', () => {
      if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).set({
          chatEnabled: chatToggle.checked
        }, { merge: true }).catch(error => console.error('Error al actualizar chatEnabled:', error));
      }
    });
  }

  // Manejar cambios de estado de autenticación
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log('Usuario logueado:', user.uid);
      if (loginScreen && mainScreen) {
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        switchTab('tab-live');
      }
      if (profileName) {
        profileName.textContent = `Hola, ${user.displayName || 'Usuario'}!`;
      }
      if (profilePicture && user.photoURL) {
        profilePicture.src = user.photoURL;
      }
      if (profileDisplayName && profileEmail) {
        profileDisplayName.value = user.displayName || 'Anónimo';
        profileEmail.value = user.email || '';
        // Cargar datos adicionales del perfil
        db.collection('users').doc(user.uid).onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            profileCbu.value = data.cbu || '';
            profileWhatsapp.value = data.whatsapp || '';
            profileBio.value = data.bio || '';
            if (chatToggle) {
              chatToggle.checked = data.chatEnabled !== false; // Por defecto true
              toggleChatVisibility(data.chatEnabled !== false);
            }
          }
        });
      }

      db.collection('connectedUsers').doc(user.uid).set({
        displayName: user.displayName || 'Anónimo',
        lastActive: Date.now(),
        banned: false
      }, { merge: true });

      const updateLastActive = setInterval(() => {
        if (auth.currentUser) {
          db.collection('connectedUsers').doc(user.uid).update({ lastActive: Date.now() });
        } else {
          clearInterval(updateLastActive);
        }
      }, 30000);

      db.collection('users').doc(user.uid).onSnapshot(doc => {
        if (doc.exists && doc.data().banned) {
          alert('Has sido expulsado del stream');
          auth.signOut();
        }
      });
    } else {
      console.log('No hay usuario logueado');
      if (loginScreen && mainScreen) {
        loginScreen.classList.remove('hidden');
        mainScreen.classList.add('hidden');
      }
    }
  });

  // Configurar chat
  const chatSendButton = document.getElementById('chat-send');
  if (chatSendButton) {
    chatSendButton.addEventListener('click', sendChatMessage);
  }

  if (mainScreen) {
    initMainScreen();
  }
  if (document.getElementById('admin-panel')) {
    initAdminPanel();
  }

  if (navItems) {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.getAttribute('data-tab');
        if (tabId) {
          switchTab(tabId);
        }
      });
    });
  }

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.addEventListener('scroll', () => {
      const appBar = pane.querySelector('.md-top-app-bar');
      if (appBar) {
        appBar.classList.toggle('scrolled', pane.scrollTop > 0);
      }
    });
  });
});

// Cambiar entre pestañas con animación
function switchTab(tabId) {
  const panes = document.querySelectorAll('.tab-pane');
  const navItems = document.querySelectorAll('.md-navigation-tab');

  panes.forEach(pane => {
    pane.classList.remove('active');
    pane.classList.add('hidden');
  });

  navItems.forEach(item => item.classList.remove('active'));

  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.classList.remove('hidden');
    setTimeout(() => activePane.classList.add('active'), 0);
  }

  const activeItem = document.querySelector(`.md-navigation-tab[data-tab="${tabId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  console.log('Pestaña activa:', tabId);
}

// Mostrar u ocultar chat según preferencia
function toggleChatVisibility(enabled) {
  const chatOverlay = document.getElementById('chat-overlay');
  const chatInputContainer = document.getElementById('chat-input-container');
  if (chatOverlay && chatInputContainer) {
    if (enabled) {
      chatOverlay.classList.remove('hidden');
      chatInputContainer.classList.remove('hidden');
    } else {
      chatOverlay.classList.add('hidden');
      chatInputContainer.classList.add('hidden');
    }
  }
}

// Inicializar pantalla principal
function initMainScreen() {
  let isStreamActive = false;
  window.currentQuestion = null;

  hideQuestion();

  const nextEventCard = document.getElementById('next-event');
  const countdownEl = document.getElementById('countdown');

  db.collection('stream').doc('current').onSnapshot(doc => {
    const player = document.getElementById('player');
    const minimizedPlayer = document.getElementById('minimized-player');
    if (player && minimizedPlayer && nextEventCard) {
      if (doc.exists && doc.data().url) {
        console.log('Stream activo:', doc.data().url);
        player.src = doc.data().url;
        minimizedPlayer.innerHTML = `<iframe src="${doc.data().url}" frameborder="0" allowfullscreen></iframe>`;
        isStreamActive = true;
        nextEventCard.classList.add('hidden');
      } else {
        console.log('Stream inactivo');
        player.src = '';
        minimizedPlayer.innerHTML = '';
        isStreamActive = false;
        nextEventCard.classList.remove('hidden');
        hideQuestion();
      }
    }
  });

  // Temporizador para próximo evento
  db.collection('stream').doc('next').onSnapshot(doc => {
    if (doc.exists && doc.data().timestamp && countdownEl) {
      const updateCountdown = () => {
        const now = Date.now();
        const timeLeft = doc.data().timestamp - now;
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
          countdownEl.textContent = '¡Pronto anunciemos el próximo evento!';
          clearInterval(countdownInterval);
        }
      };
      updateCountdown();
      const countdownInterval = setInterval(updateCountdown, 1000);
    } else if (countdownEl) {
      countdownEl.textContent = 'No hay eventos programados';
    }
  });

  db.collection('eventoActual').doc('current').onSnapshot(doc => {
    const overlay = document.getElementById('question-overlay');
    if (!overlay) {
      console.warn('Overlay no encontrado');
      return;
    }

    if (doc.exists && doc.data()) {
      const data = doc.data();
      console.log('Datos de eventoActual:', data);

      if (
        isStreamActive &&
        data.preguntaActiva &&
        data.start_time &&
        data.duration &&
        data.question &&
        Array.isArray(data.answers)
      ) {
        const timeLeft = Math.max(0, Math.floor((data.start_time + data.duration - Date.now()) / 1000));
        console.log('Tiempo restante:', timeLeft);
        if (timeLeft > 0) {
          showQuestion(data);
          console.log('Overlay visible:', !overlay.classList.contains('hidden'));
        } else {
          console.log('Pregunta expirada, desactivando...');
          db.collection('eventoActual').doc('current').update({ preguntaActiva: false })
            .catch(error => console.error('Error al desactivar pregunta:', error));
          hideQuestion();
        }
      } else {
        console.log('No hay pregunta activa, ocultando overlay');
        hideQuestion();
        console.log('Overlay oculto:', overlay.classList.contains('hidden'));
      }
    } else {
      console.log('No existe documento en eventoActual, ocultando overlay');
      hideQuestion();
      console.log('Overlay oculto:', overlay.classList.contains('hidden'));
    }
  });

  const chatOverlay = document.getElementById('chat-overlay');
  if (chatOverlay) {
    chatOverlay.innerHTML = '';
    db.collection('chat').orderBy('timestamp', 'desc').limit(10).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log('Nuevo mensaje de chat:', data);
          while (chatOverlay.children.length >= 10) {
            chatOverlay.removeChild(chatOverlay.children[0]); // Eliminar el más antiguo
          }
          const messageEl = document.createElement('div');
          messageEl.className = 'chat-message';
          messageEl.textContent = `${data.displayName}: ${data.message}`;
          chatOverlay.appendChild(messageEl); // Añadir al final
          setTimeout(() => messageEl.remove(), 5000);
        }
      });
    });
  }
}

function showQuestion(data) {
  const overlay = document.getElementById('question-overlay');
  const questionText = document.getElementById('question-text');
  const answersDiv = document.getElementById('answers');
  const timerEl = document.getElementById('time-left');
  const timerProgress = document.getElementById('timer-progress');
  const resultAnimation = document.getElementById('result-animation');
  const timerContainer = document.getElementById('timer-container');

  if (!overlay || !questionText || !answersDiv || !timerEl || !timerProgress || !resultAnimation || !timerContainer) {
    console.error('Elementos del DOM no encontrados para mostrar pregunta');
    return;
  }

  console.log('Mostrando pregunta:', data);
  window.currentQuestion = data;
  overlay.classList.remove('hidden');
  overlay.classList.add('slide-in');
  timerContainer.classList.remove('hidden');
  questionText.textContent = data.question;
  answersDiv.innerHTML = data.answers.map((ans, index) => `
    <button class="md-filled-button answer-btn" data-index="${index}">${ans}</button>
  `).join('');

  let timeLeft = Math.max(0, Math.floor((data.start_time + data.duration - Date.now()) / 1000));
  timerEl.textContent = timeLeft;

  timerProgress.style.strokeDashoffset = 283 - (283 * (data.duration / 1000 - timeLeft) / (data.duration / 1000));
  timerProgress.style.animation = `timer ${timeLeft}s linear forwards`;

  const timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      lockAnswers();
      console.log('Tiempo agotado, desactivando pregunta');
      db.collection('eventoActual').doc('current').update({ preguntaActiva: false })
        .catch(error => console.error('Error al desactivar pregunta:', error));
      setTimeout(() => hideQuestion(), 3000);
    }
  }, 1000);

  const answerButtons = answersDiv.querySelectorAll('.answer-btn');
  answerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (window.currentQuestion) {
        lockAnswers();
        const selectedIndex = parseInt(button.dataset.index);
        if (selectedIndex === window.currentQuestion.correctAnswer) {
          button.classList.add('correct');
          resultAnimation.textContent = '✅ Correcto';
          resultAnimation.classList.remove('hidden');
        } else {
          button.classList.add('incorrect');
          answerButtons[window.currentQuestion.correctAnswer].classList.add('correct');
          resultAnimation.textContent = '❌ Incorrecto';
          resultAnimation.classList.remove('hidden');
        }
        clearInterval(timer);
        console.log('Respuesta seleccionada, desactivando pregunta');
        db.collection('eventoActual').doc('current').update({ preguntaActiva: false })
          .catch(error => console.error('Error al desactivar pregunta:', error));
        setTimeout(() => hideQuestion(), 3000);
      }
    }, { once: true });
  });
}

function lockAnswers() {
  const answerButtons = document.querySelectorAll('.answer-btn');
  answerButtons.forEach(button => button.disabled = true);
}

function hideQuestion() {
  const overlay = document.getElementById('question-overlay');
  const resultAnimation = document.getElementById('result-animation');
  const timerProgress = document.getElementById('timer-progress');
  const timerContainer = document.getElementById('timer-container');
  const timeLeft = document.getElementById('time-left');

  if (overlay && resultAnimation && timerProgress && timerContainer && timeLeft) {
    console.log('Ocultando pregunta y temporizador');
    overlay.classList.add('hidden');
    overlay.classList.remove('slide-in', 'fade-out');
    resultAnimation.classList.add('hidden');
    timerProgress.style.animation = 'none';
    timerContainer.classList.add('hidden');
    timeLeft.textContent = '10';
    window.currentQuestion = null;
  } else {
    console.warn('Elementos del DOM no encontrados al ocultar pregunta');
  }
}

function initAdminPanel() {
  const connectedUsers = document.getElementById('connected-users');
  const activeUsers = document.getElementById('active-users');

  if (connectedUsers) {
    db.collection('connectedUsers').onSnapshot(snapshot => {
      connectedUsers.textContent = `${snapshot.size} usuarios conectados`;
    });
  }

  if (activeUsers) {
    db.collection('connectedUsers').onSnapshot(snapshot => {
      activeUsers.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.banned && (Date.now() - data.lastActive) < 60000) {
          const li = document.createElement('li');
          li.innerHTML = `
            ${data.displayName}
            <button class="md-filled-button btn-ban" onclick="banUser('${doc.id}')">Expulsar</button>
          `;
          activeUsers.appendChild(li);
        }
      });
    });
  }
}

window.banUser = function (userId) {
  if (userId) {
    db.collection('users').doc(userId).set({ banned: true }, { merge: true })
      .then(() => {
        db.collection('connectedUsers').doc(userId).delete();
        alert('Usuario expulsado');
      })
      .catch(error => alert('Error al expulsar usuario: ' + error.message));
  }
};