window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    const navItems = [
        { href: '/profile', label: '👤 Mi perfil' }
    ];
    await headerManager.initialize(navItems);

    const errorContainer = document.getElementById('errorContainer');
    let allFriends = [];
    let allFollowers = [];
    let friendRequests = [];

    async function loadFriends() {
        try {
            const data = await apiInstance.getFriendsFromAPI();
            // Normalizar: si devuelve array, convertir a objeto
            const normalized = Array.isArray(data) ? { success: true, friends: data } : data;
            if (normalized.success && normalized.friends) {
                allFriends = normalized.friends;
                renderFriends();
            }
        } catch (err) {
            console.error('Error loading friends:', err);
            errorContainer.innerHTML = `<div class="error-message">Error al cargar amigos</div>`;
        }
    }

    async function loadFollowers() {
        try {
            const data = await apiInstance.getFollowers();
            // Normalizar: si devuelve array, convertir a objeto
            const normalized = Array.isArray(data) ? { success: true, followers: data } : data;
            if (normalized.success && normalized.followers) {
                allFollowers = normalized.followers;
                renderFollowers();
            }
        } catch (err) {
            console.error('Error loading followers:', err);
        }
    }

    async function loadFriendRequests() {
        try {
            const data = await apiInstance.getFriendRequests();
            // Normalizar: si devuelve array, convertir a objeto
            const normalized = Array.isArray(data) ? { success: true, requests: data } : data;
            if (normalized.success && normalized.requests) {
                friendRequests = normalized.requests;
                updateRequestBadge();
                renderRequests();
            }
        } catch (err) {
            console.error('Error loading friend requests:', err);
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

    // Función auxiliar para cargar avatares Discord
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

        container.innerHTML = list.map(friend => `
                <div class="card">
                    <div class="friend-row">
                        <div class="friend-info" onclick="window.location.href='/profile?user=${friend.username || friend}'">
                            <img class="friend-avatar" 
                                 data-username="${friend.username || friend}"
                                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username || friend}" 
                                 alt="${friend.username || friend}">
                            <div class="friend-details">
                                <div class="friend-name">${friend.username || friend}</div>
                                <div class="friend-status">Amigo desde hace poco</div>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="btn-action btn-remove" onclick="removeFriend('${friend.username || friend}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `).join('');
        
        // Cargar avatares Discord
        document.querySelectorAll('.friend-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }    function renderFollowers(filtered = null) {
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

        container.innerHTML = list.map(follower => `
            <div class="card">
                <div class="friend-row">
                    <div class="friend-info" onclick="window.location.href='/profile?user=${follower.username || follower}'">
                        <img class="friend-avatar" 
                             data-username="${follower.username || follower}"
                             src="https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username || follower}" 
                             alt="${follower.username || follower}">
                        <div class="friend-details">
                            <div class="friend-name">${follower.username || follower}</div>
                            <div class="friend-status">Te sigue</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Cargar avatares Discord
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

        container.innerHTML = friendRequests.map(request => `
            <div class="card">
                <div class="friend-row">
                    <div class="friend-info" onclick="window.location.href='/profile?user=${request.username || request}'">
                        <img class="friend-avatar" 
                             data-username="${request.username || request}"
                             src="https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username || request}" 
                             alt="${request.username || request}">
                        <div class="friend-details">
                            <div class="friend-name">${request.username || request}</div>
                            <div class="friend-status">Solicitud de amistad</div>
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="btn-action btn-accept" onclick="acceptFriendRequest('${request.username || request}')">Aceptar</button>
                        <button class="btn-action btn-reject" onclick="rejectFriendRequest('${request.username || request}')">Rechazar</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Cargar avatares Discord
        document.querySelectorAll('.friend-avatar[data-username]').forEach(img => {
            loadAvatarForElement(img, img.dataset.username);
        });
    }

    // Global functions
    window.removeFriend = async function(friendName) {
        if (!confirm(`¿Eliminar a ${friendName} de amigos?`)) return;

        try {
            const data = await apiInstance.deleteFriendFromAPI(friendName);
            if (data.success) {
                allFriends = allFriends.filter(f => (f.username || f) !== friendName);
                renderFriends();
            } else {
                alert(data.error || 'Error al eliminar amigo');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    window.acceptFriendRequest = async function(username) {
        try {
            const data = await apiInstance.addFriendToAPI(username);
            if (data.success) {
                friendRequests = friendRequests.filter(r => (r.username || r) !== username);
                allFriends.push({ username: username });
                updateRequestBadge();
                renderRequests();
                renderFriends();
            } else {
                alert(data.error || 'Error al aceptar solicitud');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    window.rejectFriendRequest = async function(username) {
        try {
            const data = await apiInstance.rejectFriendRequestFromAPI(username);
            if (data.success) {
                friendRequests = friendRequests.filter(r => (r.username || r) !== username);
                updateRequestBadge();
                renderRequests();
            } else {
                alert(data.error || 'Error al rechazar solicitud');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    // Search functionality
    document.getElementById('searchFriends').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFriends.filter(f => 
            (f.username || f).toLowerCase().includes(query)
        );
        renderFriends(filtered);
    });

    document.getElementById('searchFollowers').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allFollowers.filter(f => 
            (f.username || f).toLowerCase().includes(query)
        );
        renderFollowers(filtered);
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName + 'Tab').style.display = 'block';
        });
    });

    // Load data
    await loadFriends();
    await loadFollowers();
    await loadFriendRequests();
});
