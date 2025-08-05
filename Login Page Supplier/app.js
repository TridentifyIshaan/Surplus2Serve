// Supplier Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Form toggle functionality
    const signInBtn = document.getElementById('sign-in-btn');
    const signUpBtn = document.getElementById('sign-up-btn');
    const signInForm = document.getElementById('sign-in-form');
    const signUpForm = document.getElementById('sign-up-form');

    // Toggle between sign in and sign up forms
    signInBtn.addEventListener('click', function() {
        showSignInForm();
    });

    signUpBtn.addEventListener('click', function() {
        showSignUpForm();
    });

    function showSignInForm() {
        signInBtn.classList.add('active');
        signUpBtn.classList.remove('active');
        signInForm.classList.add('active');
        signUpForm.classList.remove('active');
    }

    function showSignUpForm() {
        signUpBtn.classList.add('active');
        signInBtn.classList.remove('active');
        signUpForm.classList.add('active');
        signInForm.classList.remove('active');
    }

    // Form submission handlers
    const signInFormElement = document.getElementById('sign-in-form');
    const signUpFormElement = document.getElementById('sign-up-form');

    signInFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignIn();
    });

    signUpFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignUp();
    });

    // Demo login functionality
    const demoLoginBtn = document.getElementById('demo-login');
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleDemoLogin();
        });
    }

    // Google Sign-In functionality
    const googleSignInBtn = document.getElementById('google-signin');
    const googleSignUpBtn = document.getElementById('google-signup');

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGoogleAuth('signin');
        });
    }

    if (googleSignUpBtn) {
        googleSignUpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGoogleAuth('signup');
        });
    }

    // Sign In Handler
    function handleSignIn() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitBtn = signInFormElement.querySelector('.auth-btn:not(.demo-login)');
        setLoadingState(submitBtn, true);

        // Simulate authentication
        setTimeout(() => {
            setLoadingState(submitBtn, false);
            
            // Check credentials (in a real app, this would be a server call)
            if (authenticateUser(email, password)) {
                showNotification('Welcome back! Redirecting to your dashboard...', 'success');
                setTimeout(() => {
                    // Redirect to supplier dashboard
                    window.location.href = '../Supplier Dashboard/index.html';
                }, 1500);
            } else {
                showNotification('Invalid email or password. Please try again.', 'error');
            }
        }, 1500);
    }

    // Sign Up Handler
    function handleSignUp() {
        const farmName = document.getElementById('farm-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const termsAccepted = document.getElementById('terms-checkbox').checked;

        if (!farmName || !email || !password || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (!termsAccepted) {
            showNotification('Please accept the terms and conditions', 'error');
            return;
        }

        // Show loading state
        const submitBtn = signUpFormElement.querySelector('.auth-btn:not(.demo-login)');
        setLoadingState(submitBtn, true);

        // Simulate account creation
        setTimeout(() => {
            setLoadingState(submitBtn, false);
            
            // Create account (in a real app, this would be a server call)
            if (createAccount(farmName, email, password)) {
                showNotification('Account created successfully! Redirecting to your dashboard...', 'success');
                setTimeout(() => {
                    // Redirect to supplier dashboard
                    window.location.href = '../Supplier Dashboard/index.html';
                }, 1500);
            } else {
                showNotification('Email already exists. Please use a different email.', 'error');
            }
        }, 2000);
    }

    // Demo Login Handler
    function handleDemoLogin() {
        const submitBtn = document.getElementById('demo-login');
        setLoadingState(submitBtn, true);

        setTimeout(() => {
            setLoadingState(submitBtn, false);
            showNotification('Demo login successful! Welcome to Surplus2Serve Supplier Portal', 'success');
            setTimeout(() => {
                window.location.href = '../Supplier Dashboard/index.html';
            }, 1500);
        }, 1000);
    }

    // Google Authentication Handler
    function handleGoogleAuth(type) {
        const action = type === 'signin' ? 'Sign In' : 'Sign Up';
        showNotification(`Google ${action} feature will be available soon!`, 'info');
        
        // In a real application, you would integrate with Google OAuth
        // Example: gapi.auth2.getAuthInstance().signIn()
    }

    // Authentication Helper Functions
    function authenticateUser(email, password) {
        // Demo users for testing
        const demoUsers = [
            { email: 'farmer@example.com', password: 'password123' },
            { email: 'supplier@surplus2serve.com', password: 'demo123' },
            { email: 'admin@farm.com', password: 'admin123' }
        ];

        return demoUsers.some(user => user.email === email && user.password === password);
    }

    function createAccount(farmName, email, password) {
        // Simulate checking if email already exists
        const existingEmails = ['existing@example.com', 'taken@farm.com'];
        return !existingEmails.includes(email);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // UI Helper Functions
    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }

    // Initialize form animations
    function initializeAnimations() {
        const formElements = document.querySelectorAll('.auth-form, .auth-branding');
        formElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
            element.classList.add('fade-in');
        });
    }

    // Initialize the page
    initializeAnimations();

    // Show sign-in form by default
    showSignInForm();

    // Add input field interactions
    const inputs = document.querySelectorAll('.input-field input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });

        // Check if input has value on page load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });

    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('toggle-btn')) {
            activeElement.click();
        }
    }
});

// Prevent form submission on Enter in input fields (except submit buttons)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
        e.preventDefault();
        // Move to next input or submit button
        const form = e.target.closest('form');
        const formElements = Array.from(form.querySelectorAll('input, button'));
        const currentIndex = formElements.indexOf(e.target);
        const nextElement = formElements[currentIndex + 1];
        if (nextElement) {
            nextElement.focus();
        }
    }
});