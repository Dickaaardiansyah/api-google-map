import './style/style.css';

document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'dashboard.html';
    return;
  }

  if (document.getElementById('loginDialog')) {
    initializeLoginPage();
  }

  if (document.getElementById('username') || document.getElementById('logoutBtn')) {
    initializeDashboard();
  }
});

function initializeLoginPage() {
  const dialog = document.getElementById('loginDialog');
  const openLoginButton = document.getElementById('openLoginDialog');
  const openRegisterButton = document.getElementById('openRegisterDialog');
  const closeButton = document.getElementById('closeDialog');
  const closeButton2 = document.getElementById('closeDialog2');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  function showForm(show, hide) {
    if (!show || !hide) return;
    if (!hide.hidden) {
      hide.classList.remove('show');
      hide.classList.add('hide');
      setTimeout(() => {
        hide.classList.remove('hide');
        hide.hidden = true;

        show.hidden = false;
        show.classList.add('show');
        const firstInput = show.querySelector('input');
        if (firstInput) firstInput.focus();
        show.setAttribute("aria-hidden", "false");
        hide.setAttribute("aria-hidden", "true");
      }, 200);
    } else {
      show.hidden = false;
      show.classList.add('show');
      const firstInput = show.querySelector('input');
      if (firstInput) firstInput.focus();
      show.setAttribute("aria-hidden", "false");
      hide.setAttribute("aria-hidden", "true");
    }
  }

  if (openLoginButton) {
    openLoginButton.addEventListener('click', () => {
      dialog.showModal();
      showForm(loginForm, registerForm);
    });
  }

  if (openRegisterButton) {
    openRegisterButton.addEventListener('click', () => {
      dialog.showModal();
      showForm(registerForm, loginForm);
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => dialog.close());
  }

  if (closeButton2) {
    closeButton2.addEventListener('click', () => dialog.close());
  }

  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showForm(registerForm, loginForm);
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showForm(loginForm, registerForm);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog.open) {
      dialog.close();
    }
  });

  // Tambah elemen loading spinner ke body
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loadingOverlay';
  loadingOverlay.innerHTML = `<div class="loading-spinner"></div>`;
  document.body.appendChild(loadingOverlay);
  loadingOverlay.style.display = 'none';

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = registerForm.querySelector('input[placeholder="Username"]').value.trim();
      const email = registerForm.querySelector('input[type="email"]').value.trim();
      const password = registerForm.querySelector('input[type="password"]').value;

      if (!username || !email.includes('@') || password.length < 8) {
        alert('Username harus diisi, email harus valid, dan password minimal 8 karakter.');
        return;
      }

      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: username, email, password }),
        });

        const data = await response.json();
        alert(data.message);

        if (!data.error) {
          showForm(loginForm, registerForm);
        }
      } catch (error) {
        console.error('Register error:', error);
        alert('Terjadi kesalahan saat registrasi.');
      }
    });
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const email = loginForm.querySelector('input[type="email"]').value.trim();
      const password = loginForm.querySelector('input[type="password"]').value;
  
      if (!email || password.length < 1) {
        alert('Email dan password wajib diisi.');
        return;
      }
  
      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await response.json();
  
        if (!data.error) {
          localStorage.setItem('token', data.loginResult.token);
          localStorage.setItem('name', data.loginResult.name);
          localStorage.setItem('userId', data.loginResult.userId);
  
          dialog.close(); // pastikan ini tertarget ke <dialog>
  
          // Tampilkan loading modern
          loadingOverlay.style.display = 'flex';
          document.body.style.transition = 'opacity 0.5s ease';
          document.body.style.opacity = 0.6;
  
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Terjadi kesalahan saat login.');
      }
    });
  }
}

function initializeDashboard() {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');

  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const usernameElement = document.getElementById('username');
  if (usernameElement && name) {
    usernameElement.textContent = name;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  fetchUserData();
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');

    try {
      logoutFromServer();
    } catch (e) {
      console.log('Logout dari server gagal:', e);
    }

    window.location.href = 'index.html';
  }
}

async function fetchUserData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log('Dashboard initialized. Would fetch user data here if API endpoint was available.');
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

async function logoutFromServer() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('https://story-api.dicoding.dev/v1/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Logout response:', data.message);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

function showLoading() {
  let loadingOverlay = document.getElementById('loadingOverlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.innerHTML = `<div class="loading-spinner"></div>`;
    document.body.appendChild(loadingOverlay);
  }
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}
