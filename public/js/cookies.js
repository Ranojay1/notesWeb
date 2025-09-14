window.addEventListener('DOMContentLoaded', async () => {

    const apiInstance = await window.api.load();
    const rightDiv = document.querySelector('.right');
    // Espera a que la sesión se cargue antes de mostrar el estado
    (async () => {
        if (typeof apiInstance.load === 'function') {
            await apiInstance.load();
        }
        const auth = await apiInstance.isAuthenticated();
        if(auth) {
            rightDiv.innerHTML = `
                <span>Bienvenido, ${apiInstance.user}</span>
                <button id="logoutBtn">Logout</button>
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
    })()

});
