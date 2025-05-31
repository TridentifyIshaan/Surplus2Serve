// Initialize Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBG3mHcQWenC_jOq4aQzoT8CuvnBtxF3jM",
    authDomain: "surplus-2-serve.firebaseapp.com",
    projectId: "surplus-2-serve",
    storageBucket: "surplus-2-serve.appspot.com",
    messagingSenderId: "91050941013",
    appId: "1:91050941013:web:4333f96533240ae2f492dc",
    measurementId: "G-ZGJGQFNW1R"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Helper to add event listeners for multiple IDs
function addSocialSignIn(id, provider) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            firebase.auth().signInWithPopup(provider)
                .then(result => {
                    alert('Signed in as: ' + result.user.displayName);
                })
                .catch(error => {
                    alert(error.message);
                });
        });
    }
}

// Google
addSocialSignIn('google-signin', new firebase.auth.GoogleAuthProvider());
addSocialSignIn('google-signin-in', new firebase.auth.GoogleAuthProvider());