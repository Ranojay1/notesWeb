window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const rightDiv = document.querySelector('.right');
    const notes_site = document.querySelector('.content');

    (async () => {
        if (typeof apiInstance.load === 'function') {
            await apiInstance.load();
        }
        const auth = apiInstance.isAuthenticated();
        if(auth) {
            rightDiv.innerHTML = `
                <span>Bienvenido, ${apiInstance.user}</span>
                <a href="/createNote"><button class="btn btn-primary">Crear nota</button></a>
                <button id="logoutBtn" class="btn-logout">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                apiInstance.logout();
            });
        } else {
            rightDiv.innerHTML = `
                <a href="/login"><button class="btn btn-outline btn-login">Iniciar sesión</button></a>
                <a href="/register"><button class="btn btn-outline btn-register">Registrarse</button></a>
            `;
        }
    })();
});