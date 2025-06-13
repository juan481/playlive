// AWS IVS para jugadores
if (document.getElementById('player')) {
  if (IVSPlayer.isPlayerSupported) {
    const player = IVSPlayer.create();
    player.attachHTMLVideoElement(document.getElementById('player'));
    player.setAutoplay(true);
    player.load('TU_PLAYBACK_URL'); // Reemplaza con tu Playback URL de AWS IVS
    player.play();
  }
}

// AWS IVS para admin (anfitrión)
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
  });
}

function stopBroadcast() {
  if (client) {
    client.stopBroadcast();
    document.getElementById('broadcast').srcObject = null;
  }
}