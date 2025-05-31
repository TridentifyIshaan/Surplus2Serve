// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBG3mHcQWenC_jOq4aQzoT8CuvnBtxF3jM",
    authDomain: "surplus-2-serve.firebaseapp.com",
    projectId: "surplus-2-serve",
    storageBucket: "surplus-2-serve.firebasestorage.app",
    messagingSenderId: "91050941013",
    appId: "1:91050941013:web:4333f96533240ae2f492dc",
    measurementId: "G-ZGJGQFNW1R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Google sign-in
document.querySelectorAll('.fa-google').forEach(el => {
  el.parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        alert('Signed in as: ' + result.user.displayName);
      })
      .catch(error => {
        alert(error.message);
      });
  });
});

// Facebook sign-in
document.querySelectorAll('.fa-facebook').forEach(el => {
  el.parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    const provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        alert('Signed in as: ' + result.user.displayName);
      })
      .catch(error => {
        alert(error.message);
      });
  });
});

// Twitter (X) sign-in
document.querySelectorAll('.fa-twitter').forEach(el => {
  el.parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    const provider = new firebase.auth.TwitterAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        alert('Signed in as: ' + result.user.displayName);
      })
      .catch(error => {
        alert(error.message);
      });
  });
});

// LinkedIn sign-in (not natively supported by Firebase Auth)
document.querySelectorAll('.fa-linkedin-in').forEach(el => {
  el.parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    alert('LinkedIn sign-in is not supported directly by Firebase Authentication. You need to implement a custom authentication flow for LinkedIn.');
  });
});