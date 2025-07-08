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

// Initialize Firebase only if not already initialized
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Enhanced Google Sign-In functionality
function setupGoogleAuth() {
    // Configure Google provider
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    return provider;
}

// Helper to add event listeners for multiple IDs (legacy support)
function addSocialSignIn(id, provider) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if we're in development environment
            const isDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1' || 
                                window.location.hostname === '';
            
            if (isDevelopment) {
                // Development mode: Simulate Google Sign-In
                if (typeof showNotification === 'function') {
                    showNotification('Development Mode: Simulating Google Sign-In...', 'info');
                }
                
                setTimeout(() => {
                    const userData = {
                        username: 'Demo Google NGO',
                        email: 'demo.google.ngo@gmail.com',
                        type: 'customer',
                        authProvider: 'google-demo',
                        uid: 'demo-google-uid-' + Date.now(),
                        photoURL: 'https://via.placeholder.com/100x100?text=NGO'
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    if (typeof showNotification === 'function') {
                        showNotification(`Welcome, ${userData.username}!`, 'success');
                    } else {
                        alert(`Welcome, ${userData.username}!`);
                    }
                    
                    setTimeout(() => {
                        window.location.href = '../Customer Dashboard/index.html';
                    }, 1000);
                }, 1000);
                
                return;
            }
            
            // Production mode: Try Firebase Google Sign-In
            firebase.auth().signInWithPopup(provider)
                .then(result => {
                    const user = result.user;
                    const userData = {
                        username: user.displayName || user.email,
                        email: user.email,
                        type: 'customer',
                        authProvider: 'google',
                        uid: user.uid,
                        photoURL: user.photoURL
                    };
                    
                    // Store user data
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    // Show success message
                    if (typeof showNotification === 'function') {
                        showNotification(`Welcome, ${userData.username}!`, 'success');
                    } else {
                        alert(`Welcome, ${userData.username}!`);
                    }
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '../Customer Dashboard/index.html';
                    }, 1000);
                })
                .catch(error => {
                    console.error('Google Sign-In Error:', error);
                    
                    // Handle domain authorization error
                    if (error.code === 'auth/unauthorized-domain') {
                        if (typeof showNotification === 'function') {
                            showNotification('Domain not authorized. Using demo mode instead...', 'info');
                        }
                        
                        // Fallback to demo mode
                        setTimeout(() => {
                            const userData = {
                                username: 'Demo Google NGO',
                                email: 'demo.google.ngo@gmail.com',
                                type: 'customer',
                                authProvider: 'google-demo',
                                uid: 'demo-google-uid-' + Date.now(),
                                photoURL: 'https://via.placeholder.com/100x100?text=NGO'
                            };
                            
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                            
                            if (typeof showNotification === 'function') {
                                showNotification(`Welcome, ${userData.username}!`, 'success');
                            } else {
                                alert(`Welcome, ${userData.username}!`);
                            }
                            
                            setTimeout(() => {
                                window.location.href = '../Customer Dashboard/index.html';
                            }, 1000);
                        }, 1000);
                        
                        return;
                    }
                    
                    // Handle other errors
                    if (typeof showNotification === 'function') {
                        showNotification('Google Sign-In failed: ' + error.message, 'error');
                    } else {
                        alert('Google Sign-In failed: ' + error.message);
                    }
                });
        });
    }
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined') {
        // Setup legacy Google sign-in handlers
        try {
            const googleProvider = setupGoogleAuth();
            addSocialSignIn('google-signin', googleProvider);
            addSocialSignIn('google-signin-in', googleProvider);
        } catch (error) {
            console.error('Google Auth setup error:', error);
        }
    } else {
        console.warn('Firebase SDK not loaded');
    }
});