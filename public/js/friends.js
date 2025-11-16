window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    await headerManager.initialize();

    const errorContainer = document.getElementById('errorContainer');
    let allFriends = [];
    let allFollowers = [];
    let friendRequests = [];

    // ===== CARGAR DATOS =====
    async function loadFriends() {
        try {
            const data = await apiInstance.getFriendsFromAPI();
            allFriends = Array.isArray(data) ? data : (data.friends || []);
            renderFriends();
        } catch (err) {
            console.error('Error loading friends:', err);
            showError('Error al cargar amigos');
        }
    }

    async function loadFollowers() {
        try {
            const data = await apiInstance.getFollowers();
            allFollowers = Array.isArray(data) ? data : (data.followers || []);
            renderFollowers();
        } catch (err) {
            console.error('Error loading followers:', err);
            showError('Error al cargar seguidores');
        }
    }

    async function loadFriendRequests() {
        try {
            const data = await apiInstance.getFriendRequests();
            friendRequests = Array.isArray(data) ? data : (data.requests || []);
            updateRequestBadge();
            renderRequests();
        } catch (err) {
            console.error('Error loading friend requests:', err);
            showError('Error al cargar solicitudes');
        }
    }

    function updateRequestBadge() {
        const badge = document.getElementById('requestsBadge');
        if (friendRequests.length > 0) {
            badge.textContent = friendRequests.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ===== ACCIONES =====
    async function removeFriend(username) {
        if (!confirm(`¿Está seguro de que desea eliminar a ${username} de sus amigos?`)) return;
        try {
            await apiInstance.deleteFriendFromAPI(username);
            await loadFriends();
            showSuccess(`${username} ha sido eliminado de tus amigos`);
        } catch (err) {
            console.error('Error removing friend:', err);
            showError('Error al eliminar amigo');
        }
    }

    async function acceptRequest(username) {
        try {
            const result = await apiInstance.acceptFriendRequest(username);
            if (result.success || result.status === 'friendship_accepted') {
                await loadFriendRequests();
                await loadFriends();
                showSuccess(`¡Ahora eres amigo de ${username}!`);
            } else {
                showError('Error al aceptar solicitud');
            }
        } catch (err) {
            console.error('Error accepting request:', err);
            showError('Error al aceptar solicitud');
        }
    }

    async function rejectRequest(username) {
        if (!confirm(`¿Descartar solicitud de ${username}?`)) return;
        try {
            await apiInstance.rejectFriendRequestFromAPI(username);
            await loadFriendRequests();
            showSuccess(`Solicitud de ${username} descartada`);
        } catch (err) {
            console.error('Error rejecting request:', err);
            showError('Error al descartar solicitud');
        }
    }

    function showError(msg) {
        const container = document.getElementById('errorContainer');
        container.innerHTML = `<div class="error-message">${msg}</div>`;
        setTimeout(() => container.innerHTML = '', 3000);
    }

    function showSuccess(msg) {
        console.log(msg);
    }

    // ===== CARGAR AVATARES =====
    async function loadAvatarForElement(element, username) {
        try {
            const profilePic = await apiInstance.getProfilePic(username);
            if (profilePic && profilePic.url) {
                element.src = profilePic.url;
            }
        } catch (err) {
            console.error('Error loading avatar for', username, err);
        }
    }

    // ===== RENDERIZAR =====
    function renderFriends(filtered = null) {
        const list = filtered || allFriends;
        const container = document.getElementById('friendsList');

        if (list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-text">No tienes amigos aún</div>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(friend => {
            const username = friend.username || friend;
            return `
                <div class="card">
                    <div class="friend-row">
                        <div class="friend-info" onclick="window.location.href='/profile?user=${username}'" style="cursor: pointer;">
                            <img class="friend-avatar" 
                                 data-username="${username}"
                                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=${username}" 
                                 alt="${username}">
                            <div class="friend-details">
                                <div class="friend-name">${username}</div>
                                <div class="friend-status">Amigo</div>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="btn-action btn-remove" onclick="window.removeFriend('${username}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.friend-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    function renderFollowers(filtered = null) {
        const list = filtered || allFollowers;
        const container = document.getElementById('followersList');

        if (list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <div class="empty-text">No tienes seguidores</div>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(follower => {
            const username = follower.username || follower;
            return `
                <div class="card">
                    <div class="friend-row">
                        <div class="friend-info" onclick="window.location.href='/profile?user=${username}'" style="cursor: pointer;">
                            <img class="friend-avatar" 
                                 data-username="${username}"
                                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=${username}" 
                                 alt="${username}">
                            <div class="friend-details">
                                <div class="friend-name">${username}</div>
                                <div class="friend-status">Te sigue</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.friend-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    function renderRequests() {
        const container = document.getElementById('requestsList');

        if (friendRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📬</div>
                    <div class="empty-text">No tienes solicitudes pendientes</div>
                </div>
            `;
            return;
        }

        container.innerHTML = friendRequests.map(request => {
            const username = request.sender_username || request.username || request;
            return `
                <div class="card">
                    <div class="friend-row">
                        <div class="friend-info" onclick="window.location.href='/profile?user=${username}'" style="cursor: pointer;">
                            <img class="friend-avatar" 
                                 data-username="${username}"
                                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=${username}" 
                                 alt="${username}">
                            <div class="friend-details">
                                <div class="friend-name">${username}</div>
                                <div class="friend-status">Solicitud pendiente</div>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="btn-action btn-accept" onclick="window.acceptRequest('${username}')">✓ Aceptar</button>
                            <button class="btn-action btn-reject" onclick="window.rejectRequest('${username}')">✕ Rechazar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.friend-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    // ===== BÚSQUEDA =====
    document.getElementById('searchFriends')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFriends.filter(f => {
            const username = (f.username || f).toLowerCase();
            return username.includes(query);
        });
        renderFriends(filtered);
    });

    document.getElementById('searchFollowers')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFollowers.filter(f => {
            const username = (f.username || f).toLowerCase();
            return username.includes(query);
        });
        renderFollowers(filtered);
    });

    // ===== TABS =====
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            
            tab.classList.add('active');
            const tabContent = document.getElementById(tab.dataset.tab + 'Tab');
            if (tabContent) tabContent.style.display = 'block';
        });
    });

    // ===== HACER DISPONIBLES GLOBALMENTE =====
    window.removeFriend = removeFriend;
    window.acceptRequest = acceptRequest;
    window.rejectRequest = rejectRequest;

    // ===== CARGAR DATOS INICIALES =====
    await loadFriends();
    await loadFollowers();
    await loadFriendRequests();
});
