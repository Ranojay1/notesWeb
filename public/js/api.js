class apiLoader {
    constructor() {
        // Centraliza la URL base de la API aquí
        this.apiBase = 'https://api.thinkverse.site/api';
        //this.load();
    }
    async load() {
        this.user = localStorage.getItem('user') || ''; 
        this.pass = localStorage.getItem('pass') || '';
        this.isDiscordAuth = this.pass && this.pass.startsWith('DISCORD_');
        this.discordId = this.isDiscordAuth ? this.pass.replace('DISCORD_', '') : null;
        
        if(!this.user || !this.pass) {
            this.loggedIn = false;
        } else {
            // Cachear el estado de login para no validar múltiples veces
            if (this._loginCheckCache === undefined) {
                const loginStatus = await this.checkLogin();
                this._loginCheckCache = !!(loginStatus && loginStatus.success);
            }
            this.loggedIn = this._loginCheckCache;
            if(!this.loggedIn) this.logout();
        }

        return this;
    }
    
    // Helper para obtener las credenciales en el formato correcto
    getAuthPayload() {
        if (this.isDiscordAuth) {
            return { user: this.user, discordId: this.discordId };
        }
        return { user: this.user, password: this.pass };
    }

    isAuthenticated() {
        return this.loggedIn;
    }

    getUser() {
        if(!this.isAuthenticated()) return null;
        return this.user;
    }
    
    async register(user, email, pass) {
        try {
            const response = await fetch(this.apiBase + '/registerUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user, email, pass })
            });
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { success: text.trim() === 'success' };
            }
            return data;
        } catch (error) {
            console.error('Error during registration:', error);
            return { success: false };
        }
    }

    async getFollowingUsers() {
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getFollowing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload() })
            });
            const data = await response.json();
            return data.following;
        } catch (error) {
            console.error('Error fetching following users:', error);
            return [];
        }
    }


    async getFollowerNotes(limit = 20, offset = 0) {
        if(!this.isAuthenticated()) return [];
        try {
            const following = await this.getFollowingUsers();
            const response = await fetch(this.apiBase + '/getFollowerNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), followingUsers: following, limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching follower notes:', error);
            return [];
        }
    }

    async checkLogin() {
        const {user, pass} = this;
        try {
            // Si es autenticación de Discord, usar endpoint especial
            if (pass && pass.startsWith('DISCORD_')) {
                const discordId = pass.replace('DISCORD_', '');
                const response = await fetch(this.apiBase + '/discordLogin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: user, discordId })
                });
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = { success: text.trim() === 'success' };
                }
                return data;
            }
            
            // Login normal con usuario y contraseña
            const response = await fetch(this.apiBase + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user, password: pass })
            });
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { success: text.trim() === 'success' };
            }
            return data;
        } catch (error) {
            console.error('Error checking login:', error);
            return { success: false };
        }
    }

    async getPublicComments(noteId, limit = 20, offset = 0) {
        try {
            const response = await fetch(this.apiBase + '/getPublicComments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching public comments:', error);
            return [];
        }
    }

    async comment(noteId, content) {
        if(!this.isAuthenticated()) return { success: false, message: 'Not authenticated' };
        try {
            const response = await fetch(this.apiBase + '/sendComment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, content })
            });
            if (response.status === 201) return { success: true };
            // intentar parsear JSON si hay cuerpo
            let data;
            try { data = await response.json(); } catch (e) { data = { success: false, status: response.status } }
            return { success: !!(data && data.success), data };
        } catch (error) {
            console.error('Error sending comment:', error);
            return { success: false, error: String(error) };
        }
    }

    async canComment(noteId) {
        if(!this.isAuthenticated()) return false;
        try {
            const response = await fetch(this.apiBase + '/canComment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), noteId })
            });
            const data = (await response.json()).canComment;
            return data;
        } catch (error) {
            console.error('Error checking canComment status:', error);
            return false;
        }
    }

    async getComments(noteId, limit = 20, offset = 0) {
        try {
            const response = await fetch(this.apiBase + '/getPrivateComments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching public comments:', error);
            return [];
        }
    }

    async isFollowing(user) {
        if(!this.isAuthenticated()) return false;
        try {
            const response = await fetch(this.apiBase + '/isFollowing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), target: user })
            });
            const data = (await response.json()).isFollowing;
            return data;
        } catch (error) {
            console.error('Error checking following status:', error);
            return false;
        }
    }

    async followUser(targetUser) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), target: targetUser })
            });
            const data = await response.text();
            return { success: data === 'success' };
        } catch (error) {
            console.error('Error following user:', error);
            return { success: false };
        }
    }

    async unfollowUser(targetUser) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/deleteFollow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), target: targetUser })
            });
            const data = await response.text();
            return { success: data === 'success' };
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return { success: false };
        }
    }

    async getMyNotes(limit = 20, offset = 0){
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my notes:', error);
            return [];
        }
    }

    async getFriendNotes(limit = 20, offset = 0){
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getFriendNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching friend notes:', error);
            return [];
        }
    }


    async getFriends() {
        if(!this.isAuthenticated()) return false;
        try {
            const response = await fetch(this.apiBase + '/getFriends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload() })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching friends:', error);
            return [];
        }
    }

    async areFriends(otherUser) {
        if(!this.isAuthenticated()) return false;
        const friends = await this.getFriends();
        return friends.includes(otherUser);
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('pass');
        this.user = '';
        this.pass = '';
        this.loggedIn = false;
        location.reload();
    }

    saveLogin(){
        localStorage.setItem('user', this.user);
        localStorage.setItem('pass', this.pass);
        this.loggedIn = true;
    }

    async createNote({ title, content, privacy }) {
        if(!this.isAuthenticated()) return null;
        try {
            const response = await fetch(this.apiBase + '/sendNewNote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...this.getAuthPayload(), title, content, privacy })
            });
            if (!response.ok) {
                // intentar leer mensaje de error en texto
                let text = null;
                try { text = await response.text(); } catch (e) { /* ignore */ }
                return { success: false, status: response.status, message: text };
            }

            // Si el backend responde JSON, parsearlo; si responde texto (p.ej. "Created"), devolver objeto uniforme
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                return data;
            }

            // fallback: leer como texto
            let text = null;
            try { text = await response.text(); } catch (e) { /* ignore */ }
            // Si el texto contiene un id numérico, devolverlo
            const maybeId = parseInt((text || '').trim());
            if (!isNaN(maybeId)) return { success: true, id: maybeId, message: text };
            // Respuesta tipo "Created" -> devolver formato consistente
            return { success: true, message: text };
        } catch (error) {
            console.error('Error creating note:', error);
            return null;
        }
    }

    async getNote(id) {
        const body = JSON.stringify({ id, ...this.getAuthPayload() });
        try {
            const response = await fetch(this.apiBase + '/getNote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body
            });
            if (!response.ok) {
                // Si el endpoint no existe o hay error, retorna null
                return null;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching note:', error);
            return null;
        }
    }

    async getPublicNotes(id, limit = 20, offset = 0) {
        const body = JSON.stringify({ id, limit, offset });
        try {
            const response = await fetch(this.apiBase + '/getPublicNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body
            });
            if (!response.ok) {
                // Si el endpoint no existe o hay error, retorna array vacío
                return [];
            }
            const data = await response.json();
            return data;
        } catch (error) {
            // Captura cualquier error de red o parsing
            return [];
        }
    }

    async login (user, pass) { 
        this.user = user;
        this.pass = pass;
        const loginStatus = await this.checkLogin();
        if(loginStatus && loginStatus.success) this.saveLogin();
        else this.logout();
        return loginStatus;
    }

    // ========== MÉTODOS PARA AMIGOS ==========
    async getFriendsFromAPI() {
        if(!this.isAuthenticated()) return { success: false, friends: [] };
        try {
            const response = await fetch(this.apiBase + '/getFriends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getAuthPayload())
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching friends:', error);
            return { success: false, friends: [] };
        }
    }

    async getFollowers() {
        if(!this.isAuthenticated()) return { success: false, followers: [] };
        try {
            const response = await fetch(this.apiBase + '/getFollowers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getAuthPayload())
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching followers:', error);
            return { success: false, followers: [] };
        }
    }

    async getFriendRequests() {
        if(!this.isAuthenticated()) return { success: false, requests: [] };
        try {
            const response = await fetch(this.apiBase + '/hasFriendRequests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getAuthPayload())
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            return { success: false, requests: [] };
        }
    }

    async addFriendToAPI(targetUser) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/addFriend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), friend: targetUser })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding friend:', error);
            return { success: false };
        }
    }

    async acceptFriendRequest(targetUser) {
        // Aceptar es lo mismo que agregar (si hay una solicitud pendiente del otro lado, se acepta automáticamente)
        return this.addFriendToAPI(targetUser);
    }

    async deleteFriendFromAPI(targetUser) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/deleteFriend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), friend: targetUser })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting friend:', error);
            return { success: false };
        }
    }

    async rejectFriendRequestFromAPI(targetUser) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/rejectFriendRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), sender: targetUser })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            return { success: false };
        }
    }

    // ========== MÉTODOS PARA PERFIL ==========
    async getUserProfile(targetUser) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            const response = await fetch(this.apiBase + '/getUserProfile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, username: targetUser })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    async getFollowStats(targetUser) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            const response = await fetch(this.apiBase + '/getFollowStats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, username: targetUser })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching follow stats:', error);
            return null;
        }
    }

    // ========== MÉTODOS PARA BÚSQUEDA ==========
    async searchMixed(query) {
        try {
            const response = await fetch(this.apiBase + '/searchMixed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching:', error);
            return { results: [], users: [], notes: [] };
        }
    }

    // ========== MÉTODOS PARA NOTAS ==========
    async getFriendNotesFromAPI(limit = 20, offset = 0) {
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getFriendNotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching friend notes:', error);
            return [];
        }
    }

    async getNoteWithDetails(noteId) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            const response = await fetch(this.apiBase + '/getNote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, id: noteId })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching note:', error);
            return null;
        }
    }


    async getUserNotes(targetUser, limit = 20, offset = 0) {
        try {
            const response = await fetch(this.apiBase + '/getNotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: targetUser, limit, offset })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user notes:', error);
            return [];
        }
    }

    // ========== MÉTODOS PARA COMENTARIOS ==========
    async getCommentsForNote(noteId, limit = 20, offset = 0) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            
            // Intentar obtener comentarios públicos primero
            let response = await this.privateGetPublicComments(noteId, limit, offset);
            
            // Si falla, intentar comentarios privados
            if (!response) {
                response = await fetch(this.apiBase + '/getPrivateComments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: noteId, limit, offset })
                });
            }
            
            // Si sigue sin respuesta válida, retornar array vacío
            if (!response || !response.ok) {
                console.error('No response or response not ok');
                return [];
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    async privateGetPublicComments(noteId, limit = 20, offset = 0) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            const response = await fetch(this.apiBase + '/getPublicComments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, id: noteId, limit, offset })
            });
            if (!response.ok) {
                console.error(`HTTP ${response.status} en getPublicComments`);
                return null;
            }
            return response;
        } catch (e) {
            console.error('Error en privateGetPublicComments:', e);
            return null;
        }
    }
    

    async addCommentToNote(noteId, commentText) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/sendComment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, content: commentText })
            });
            if (!response.ok) {
                console.error(`HTTP ${response.status}: ${response.statusText}`);
                return { success: false };
            }
            return { success: true };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false };
        }
    }

    // ========== MÉTODOS DISCORD ==========
    async linkDiscordAccount(discordId) {
        if(!this.isAuthenticated()) return { success: false };
        try {
            const response = await fetch(this.apiBase + '/linkDiscord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), discordId })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error linking Discord:', error);
            return { success: false };
        }
    }

    async getProfilePic(target) {
        try {
            const response = await fetch(this.apiBase + '/getProfilePic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });
            const data = await response.json();
            if(!data) return { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + target };
            return data;
        } catch (error) {
            console.error('Error fetching profile pic:', error);
            return null;
        }
    }
}
window.api = new apiLoader();