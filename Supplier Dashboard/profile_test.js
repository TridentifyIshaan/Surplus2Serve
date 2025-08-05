// Simple Profile Test for Supplier Dashboard
console.log('🚀 Starting Supplier Dashboard Profile Test');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded');
    
    // Test if Firebase Auth Module is loaded
    if (window.FirebaseAuth) {
        console.log('✅ Firebase Auth Module is available');
        
        if (window.FirebaseAuth.isAuthenticated()) {
            const userData = window.FirebaseAuth.getStoredUserData();
            console.log('🔐 User is authenticated:', userData);
            updateSupplierProfile(userData);
        } else {
            console.log('👤 No authenticated user');
            updateSupplierProfile(null);
        }
    } else {
        console.log('❌ Firebase Auth Module not found');
        // Check localStorage fallback
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const userData = JSON.parse(currentUser);
                console.log('📦 Found user in localStorage:', userData);
                updateSupplierProfile(userData);
            } catch (e) {
                console.error('❌ Error parsing localStorage user data:', e);
                updateSupplierProfile(null);
            }
        } else {
            console.log('💾 No user data in localStorage');
            updateSupplierProfile(null);
        }
    }
    
    // Set up profile button click event
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    console.log('🔍 Profile elements check:', {
        profileBtn: !!profileBtn,
        profileMenu: !!profileMenu,
        profileBtnElement: profileBtn,
        profileMenuElement: profileMenu
    });
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Profile button clicked!');
            
            profileBtn.classList.toggle('active');
            profileMenu.classList.toggle('hidden');
            
            console.log('🎭 Profile menu state:', {
                isActive: profileBtn.classList.contains('active'),
                isHidden: profileMenu.classList.contains('hidden')
            });
        });
        
        console.log('✅ Profile button event listener added');
    } else {
        console.error('❌ Profile elements not found - cannot add event listener');
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.profile-dropdown')) {
            if (profileBtn) profileBtn.classList.remove('active');
            if (profileMenu) profileMenu.classList.add('hidden');
        }
    });
});

function updateSupplierProfile(user) {
    console.log('🔄 Updating supplier profile with user:', user);
    
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const signinBtn = document.getElementById('signin-btn');
    const signoutBtn = document.getElementById('signout-btn');
    
    console.log('🔍 Profile update elements check:', {
        profileName: !!profileName,
        profileEmail: !!profileEmail,
        signinBtn: !!signinBtn,
        signoutBtn: !!signoutBtn
    });
    
    if (user) {
        const displayName = user.displayName || user.username || user.email?.split('@')[0] || 'Supplier';
        const email = user.email || 'supplier@example.com';
        
        if (profileName) {
            profileName.textContent = displayName;
            console.log('📝 Updated profile name to:', displayName);
        }
        
        if (profileEmail) {
            profileEmail.textContent = email;
            console.log('📧 Updated profile email to:', email);
        }
        
        if (signinBtn) signinBtn.style.display = 'none';
        if (signoutBtn) signoutBtn.style.display = 'block';
        
        console.log('✅ Profile updated for authenticated user');
    } else {
        if (profileName) {
            profileName.textContent = 'Guest User';
            console.log('📝 Set profile name to: Guest User');
        }
        
        if (profileEmail) {
            profileEmail.textContent = 'guest@example.com';
            console.log('📧 Set profile email to: guest@example.com');
        }
        
        if (signinBtn) signinBtn.style.display = 'block';
        if (signoutBtn) signoutBtn.style.display = 'none';
        
        console.log('👤 Profile set to guest mode');
    }
}

// Test function to simulate user login
function testLogin() {
    const testUser = {
        uid: 'test-supplier-' + Date.now(),
        email: 'test.supplier@example.com',
        displayName: 'Test Supplier User',
        type: 'supplier',
        authProvider: 'test'
    };
    
    localStorage.setItem('currentUser', JSON.stringify(testUser));
    localStorage.setItem('isAuthenticated', 'true');
    
    console.log('🧪 Test user created:', testUser);
    updateSupplierProfile(testUser);
    
    if (window.FirebaseAuth && window.FirebaseAuth.showNotification) {
        window.FirebaseAuth.showNotification('Test user logged in!', 'success');
    }
}

// Make test function available globally
window.testSupplierLogin = testLogin;
