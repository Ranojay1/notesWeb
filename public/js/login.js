window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const header = document.querySelector('.header');
    const divForm = document.querySelector('.login-container');

    if (apiInstance && typeof apiInstance.load === 'function') {
        await apiInstance.load();
    }

    const auth = apiInstance && typeof apiInstance.isAuthenticated === 'function' ? apiInstance.isAuthenticated() : false;
    if (auth) {
        window.location.href = '/';
    } else {
        // mark body so we can scope full-viewport centering styles to login page only
        document.body.classList.add('login-page');
        if (header) {
            header.innerHTML = `<h1>Login</h1>`;
        }
        if (divForm) {
            divForm.innerHTML = `
                <div class="login-card">
                    <h2>Iniciar sesión</h2>
                    <form id="loginForm" class="minimal-login-form">
                        <label for="user">Usuario</label>
                        <input class="form-control" type="text" id="user" name="user" required>

                        <label for="pass">Contraseña</label>
                        <input class="form-control" type="password" id="pass" name="pass" required>

                        <button type="submit" class="btn-login">Iniciar sesión</button>
                    </form>
                    <div id="mensaje"></div>
                </div>
            `;

            // Manejo del submit
            const loginForm = document.getElementById('loginForm');
            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const user = document.getElementById('user').value;
                const pass = document.getElementById('pass').value;
                try {
                    const loginStatus = await apiInstance.login(user, pass);
                    if (loginStatus && loginStatus.success) {
                        
                        window.location.href = '/';
                    } else {
                        const mensaje = document.getElementById('mensaje');
                        if (mensaje) mensaje.innerHTML = 'Login incorrecto';
                    }
                } catch (err) {
                    const mensaje = document.getElementById('mensaje');
                    console.error('Login error:', err);
                    if (mensaje) mensaje.innerHTML = 'Login incorrecto';
                }
            });
        }
    }
});