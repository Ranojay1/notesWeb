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
            header.innerHTML = `<h1>Notes</h1>`;
        }
        if (divForm) {
            divForm.innerHTML = `
                <div class="login-card">
                    <h2>Registro</h2>
                    <form id="loginForm" class="minimal-login-form">
                        <label for="user">Usuario</label>
                        <input class="form-control" type="text" id="user" name="user" required>

                        <label for="email">Correo</label>
                        <input class="form-control" type="email" id="email" name="email" required>

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
                const email = document.getElementById('email').value;
                const pass = document.getElementById('pass').value;
                try {
                    const registerStatus = await apiInstance.register(user, email, pass);
                    if (registerStatus && registerStatus.success) {
                        apiInstance.user = user; // Setea el usuario en la instancia
                        apiInstance.pass = pass; // Setea la contraseña en la instancia
                        apiInstance.saveLogin(); // Guarda la sesión
                        window.location.href = '/';
                    } else {
                        const mensaje = document.getElementById('mensaje');
                        if (mensaje) mensaje.innerHTML = 'Registro incorrecto';
                    }
                } catch (err) {
                    const mensaje = document.getElementById('mensaje');
                    console.error('Registro error:', err);
                    if (mensaje) mensaje.innerHTML = 'Registro incorrecto';
                }
            });
        }
    }
});