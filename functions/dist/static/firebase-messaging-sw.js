// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyB6iy69TsVPpstHblohdVn7mGnIrETCSLo",
  authDomain: "gatbook-163112.firebaseapp.com",
  databaseURL: "https://gatbook-163112.firebaseio.com",
  projectId: "gatbook-163112",
  storageBucket: "gatbook-163112.appspot.com",
  messagingSenderId: "177876099439"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  return self.registration.showNotification(null, null);
});
// [END background_handler]