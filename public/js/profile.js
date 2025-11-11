window.addEventListener('DOMContentLoaded', async () => {
    const apiInstance = await window.api.load();
    
    if (!apiInstance.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Inicializar header
    const headerManager = new HeaderManager(apiInstance);
    await headerManager.initialize();

    // Get username from URL or use current user
    const params = new URLSearchParams(window.location.search);
    const targetUser = params.get('user') || apiInstance.user;
    const isOwnProfile = targetUser === apiInstance.user;

    const errorContainer = document.getElementById('errorContainer');
    const profileHeader = document.getElementById('profileHeader');
    const contentLoading = document.getElementById('contentLoading');
    const profileContent = document.getElementById('profileContent');

    contentLoading.style.display = 'block';

    try {
        // Cargar datos del perfil
        const data = await apiInstance.getUserProfile(targetUser);

        if (!data || !data.user) {
            throw new Error(data?.error || 'No se pudo cargar el perfil');
        }

        const profile = data.user;

        // Mostrar header del perfil
        document.getElementById('profileUsername').textContent = profile.username;
        
        const avatar = document.getElementById('profileAvatar');
        // Obtener foto de perfil Discord si existe
        const profilePic = await apiInstance.getProfilePic(profile.username);
        if (profilePic && profilePic.url) {
            avatar.src = profilePic.url;
        } else {
            avatar.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.username;
        }

        if (profile.discord_username) {
            document.getElementById('profileDiscord').textContent = '@' + profile.discord_username;
        }

        // Cargar estadísticas
        const statsData = await apiInstance.getFollowStats(targetUser);
        if (statsData && statsData.success) {
            document.getElementById('followerCount').textContent = statsData.followers || 0;
            document.getElementById('followingCount').textContent = statsData.following || 0;
        }

        // Botones de acción
        const actionsDiv = document.getElementById('profileActions');
        if (isOwnProfile) {
            actionsDiv.innerHTML = `
                <a href="/myNotes" class="btn-action primary">Ver mis notas</a>
                <button class="btn-action" id="btnSettings">Configuración</button>
            `;
            document.getElementById('btnSettings').addEventListener('click', () => {
                // TODO: Implementar página de settings
                alert('Configuración próximamente');
            });
        } else {
            // TODO: Agregar botones de amigo
            actionsDiv.innerHTML = `
                <button class="btn-action primary" id="btnAddFriend">Agregar amigo</button>
                <button class="btn-action" id="btnMessage">Mensaje</button>
            `;
            document.getElementById('btnAddFriend').addEventListener('click', async () => {
                try {
                    const result = await apiInstance.addFriendToAPI(targetUser);
                    alert(result.message || 'Solicitud enviada');
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            });
        }

        // Cargar notas del usuario
        // Usar notas del perfil
        const notesList = document.getElementById('notesList');

        if (data.notes && data.notes.length > 0) {
            document.getElementById('friendCount').textContent = data.notes.length;
            notesList.innerHTML = data.notes.map(note => `
                <div class="note-item" onclick="window.location.href='/note?id=${note.id}'">
                    <div class="note-title">${note.title || 'Sin título'}</div>
                    <div class="note-preview">${note.content?.substring(0, 50) || '...'}</div>
                </div>
            `).join('');
        } else {
            notesList.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div>Sin notas</div>';
        }

        // Usar amigos del perfil
        const friendsList = document.getElementById('friendsList');

        if (data.friends && data.friends.length > 0) {
            friendsList.innerHTML = data.friends.map(friend => `
                <div class="friend-item" onclick="window.location.href='/profile?user=${friend.username || friend}'">
                    <img class="friend-avatar" 
                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username || friend}" 
                         alt="${friend.username || friend}">
                    <div class="friend-name">${friend.username || friend}</div>
                </div>
            `).join('');
        } else {
            friendsList.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div>Sin amigos</div>';
        }

        // Cargar seguidores
        const followersData = await apiInstance.getFollowers();
        const followersList = document.getElementById('followersList');
        // Normalizar si es array
        const normalized = Array.isArray(followersData) ? { success: true, followers: followersData } : followersData;

        if (normalized.success && normalized.followers && normalized.followers.length > 0) {
            followersList.innerHTML = normalized.followers.map(follower => `
                <div class="friend-item" onclick="window.location.href='/profile?user=${follower.username || follower}'">
                    <img class="friend-avatar" 
                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username || follower}" 
                         alt="${follower.username || follower}">
                    <div class="friend-name">${follower.username || follower}</div>
                </div>
            `).join('');
        } else {
            followersList.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div>Sin seguidores</div>';
        }

        profileHeader.style.display = 'block';
        profileContent.style.display = 'block';
        contentLoading.style.display = 'none';

    } catch (err) {
        console.error('Error loading profile:', err);
        errorContainer.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
        contentLoading.style.display = 'none';
    }

    // Tabs functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName + 'Tab').style.display = 'block';
        });
    });
});
