// Login/Registration functionality for Customer Dashboard
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");
const sign_in_btn2 = document.querySelector("#sign-in-btn2");
const sign_up_btn2 = document.querySelector("#sign-up-btn2");

// UI switching
sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
});
sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
});
sign_up_btn2.addEventListener("click", () => {
    container.classList.add("sign-up-mode2");
});
sign_in_btn2.addEventListener("click", () => {
    container.classList.remove("sign-up-mode2");
});

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Sign In Form
    const signInForm = document.querySelector('.sign-in-form');
    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    }

    // Sign Up Form
    const signUpForm = document.querySelector('.sign-up-form');
    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }
});

function handleSignIn(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Simulate authentication (in real app, this would be an API call)
    const user = {
        username: username,
        email: `${username.toLowerCase().replace(/\s+/g, '')}@customer.com`,
        role: 'customer',
        loginTime: new Date().toISOString()
    };

    // Save user to localStorage (using different key for customer)
    localStorage.setItem('surplus2serve_customer', JSON.stringify(user));
    
    showNotification('Login successful! Redirecting...', 'success');
    
    // Redirect to customer dashboard after short delay
    setTimeout(() => {
        window.location.href = '../Customer Dashboard/index.html';
    }, 1500);
}

function handleSignUp(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username') || e.target.querySelector('input[placeholder*="Username"]')?.value;
    const email = formData.get('email') || e.target.querySelector('input[type="email"]')?.value;
    const password = formData.get('password') || e.target.querySelector('input[type="password"]')?.value;
    
    if (!username || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Simulate registration
    const user = {
        username: username,
        email: email,
        role: 'customer',
        registrationTime: new Date().toISOString()
    };

    // Save user to localStorage (using different key for customer)
    localStorage.setItem('surplus2serve_customer', JSON.stringify(user));
    
    showNotification('Registration successful! Redirecting...', 'success');
    
    // Redirect to customer dashboard after short delay
    setTimeout(() => {
        window.location.href = '../Customer Dashboard/index.html';
    }, 1500);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        font-family: 'Inter', sans-serif;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}