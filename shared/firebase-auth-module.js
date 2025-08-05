/**
 * Surplus2Serve Firebase Authentication Module
 * Centralized authentication system for all login pages
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHX7kxDf-Qs3z0yRHXgT5z_5CTKYxdSOk",
  authDomain: "surplus2serve-15628.firebaseapp.com",
  projectId: "surplus2serve-15628",
  storageBucket: "surplus2serve-15628.firebasestorage.app",
  messagingSenderId: "495921372827",
  appId: "1:495921372827:web:cec3773531a58665ac303e",
  measurementId: "G-7BTBJ38E4N"

};


// Initialize Firebase
let app;
let auth;
let isFirebaseInitialized = false;

function initializeFirebase() {
    if (isFirebaseInitialized) return;
    
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
            return false;
        }

        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            console.log('✅ Firebase initialized successfully');
        } else {
            app = firebase.app();
            auth = firebase.auth();
        }

        // Configure persistence
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // Set up auth state listener
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                handleAuthStateChange(user, true);
            } else {
                console.log('User is signed out');
                handleAuthStateChange(null, false);
            }
        });

        isFirebaseInitialized = true;
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Authentication state change handler
function handleAuthStateChange(user, isSignedIn) {
    if (isSignedIn && user) {
        // Store user data in localStorage
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            authProvider: getAuthProvider(user),
            signInTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
    } else {
        // Clear user data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
    }
}

// Get authentication provider
function getAuthProvider(user) {
    if (user.providerData && user.providerData.length > 0) {
        const providerId = user.providerData[0].providerId;
        switch (providerId) {
            case 'google.com': return 'google';
            case 'password': return 'email';
            default: return 'unknown';
        }
    }
    return 'unknown';
}

// Google Authentication
function setupGoogleAuth() {
    if (!auth) {
        console.error('Firebase auth not initialized');
        return null;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Ensure we always get a fresh token
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    return provider;
}

// Email/Password Sign Up
async function signUpWithEmail(email, password, displayName = '') {
    if (!auth) {
        throw new Error('Firebase auth not initialized');
    }

    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile with display name
        if (displayName) {
            await user.updateProfile({
                displayName: displayName
            });
        }

        // Send email verification
        await user.sendEmailVerification();
        
        console.log('✅ User created successfully:', user.email);
        return {
            success: true,
            user: user,
            message: 'Account created successfully! Please check your email for verification.'
        };
    } catch (error) {
        console.error('❌ Sign up error:', error);
        return {
            success: false,
            error: error,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

// Email/Password Sign In
async function signInWithEmail(email, password) {
    if (!auth) {
        throw new Error('Firebase auth not initialized');
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ User signed in successfully:', user.email);
        return {
            success: true,
            user: user,
            message: 'Signed in successfully!'
        };
    } catch (error) {
        console.error('❌ Sign in error:', error);
        return {
            success: false,
            error: error,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

// Google Sign In
async function signInWithGoogle() {
    if (!auth) {
        throw new Error('Firebase auth not initialized');
    }

    try {
        const provider = setupGoogleAuth();
        if (!provider) {
            throw new Error('Google provider setup failed');
        }

        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('✅ Google sign in successful:', user.email);
        return {
            success: true,
            user: user,
            message: `Welcome, ${user.displayName || user.email}!`
        };
    } catch (error) {
        console.error('❌ Google sign in error:', error);
        
        // Handle specific Google auth errors
        if (error.code === 'auth/popup-closed-by-user') {
            return {
                success: false,
                error: error,
                message: 'Sign-in was cancelled. Please try again.'
            };
        } else if (error.code === 'auth/unauthorized-domain') {
            return {
                success: false,
                error: error,
                message: 'This domain is not authorized for Google Sign-In.'
            };
        }
        
        return {
            success: false,
            error: error,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

// Sign Out
async function signOut() {
    if (!auth) {
        throw new Error('Firebase auth not initialized');
    }

    try {
        await auth.signOut();
        console.log('✅ User signed out successfully');
        return {
            success: true,
            message: 'Signed out successfully!'
        };
    } catch (error) {
        console.error('❌ Sign out error:', error);
        return {
            success: false,
            error: error,
            message: 'Failed to sign out. Please try again.'
        };
    }
}

// Password Reset
async function resetPassword(email) {
    if (!auth) {
        throw new Error('Firebase auth not initialized');
    }

    try {
        await auth.sendPasswordResetEmail(email);
        console.log('✅ Password reset email sent');
        return {
            success: true,
            message: 'Password reset email sent! Please check your inbox.'
        };
    } catch (error) {
        console.error('❌ Password reset error:', error);
        return {
            success: false,
            error: error,
            message: getFirebaseErrorMessage(error.code)
        };
    }
}

// Get current user
function getCurrentUser() {
    if (!auth) return null;
    return auth.currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null || localStorage.getItem('isAuthenticated') === 'true';
}

// Get stored user data
function getStoredUserData() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Firebase error message mapper
function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/unauthorized-domain': 'This domain is not authorized for authentication.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}

// Notification helper
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('auth-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'auth-notification-styles';
        styles.textContent = `
            .auth-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                font-family: 'Inter', sans-serif;
            }
            
            .auth-notification.success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            
            .auth-notification.error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            
            .auth-notification.warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
            }
            
            .auth-notification.info {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
                padding: 0;
                margin: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const initialized = initializeFirebase();
    if (!initialized) {
        console.warn('Firebase initialization failed');
    }
});

// Export functions for global use
window.FirebaseAuth = {
    initialize: initializeFirebase,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    getCurrentUser,
    isAuthenticated,
    getStoredUserData,
    showNotification
};
