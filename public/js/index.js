window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    const rightDiv = document.querySelector('.right');
    const notes_site = document.querySelector('.content');

    (async () => {
        if (typeof apiInstance.load === 'function') {
            await apiInstance.load();
        }
        const auth = apiInstance.isAuthenticated();
        if(!auth){
            rightDiv.innerHTML = `
                <a href="/login"><button class="btn btn-primary">Iniciar sesión</button></a>
                <a href="/register"><button class="btn btn-primary" style="background: #10b981; margin-left: 8px;">Registrarse</button></a>
            `;
        }
    })();
});