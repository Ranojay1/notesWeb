class apiLoader {
    constructor() {
        this.apiBase = 'https://api.thinkverse.site/api';
    }

    async load() {
        this.user = localStorage.getItem('user') || ''; 
        this.accessToken = localStorage.getItem('accessToken') || '';
        this.refreshToken = localStorage.getItem('refreshToken') || '';
        this.pass = localStorage.getItem('pass') || '';
        
        // Detectar tipo de autenticación
        this.isTokenAuth = !!(this.accessToken && this.refreshToken);
        this.isDiscordAuth = this.isTokenAuth || this.pass?.startsWith('DISCORD_');
        this.discordId = this.isDiscordAuth && !this.isTokenAuth ? this.pass.replace('DISCORD_', '') : null;
        
        if (!this.user || (!this.pass && !this.isTokenAuth)) {
            this.loggedIn = false;
        } else {
            if (this._loginCheckCache === undefined) {
                const loginStatus = await this.checkLogin();
                this._loginCheckCache = !!(loginStatus?.success);
            }
            this.loggedIn = this._loginCheckCache;
            if (!this.loggedIn) this.logout();
        }
        return this;
    }
    
    getAuthPayload() {
        // Si tenemos tokens, usarlos (más seguro)
        if (this.isTokenAuth) {
            return { user: this.user, token: this.accessToken };
        }
        // Fallback a método legacy
        return this.isDiscordAuth 
            ? { user: this.user, discordId: this.discordId }
            : { user: this.user, password: this.pass };
    }

    async _request(endpoint, body = {}, requiresAuth = false) {
        if (requiresAuth && !this.loggedIn) return null;
        
        try {
            const headers = { 'Content-Type': 'application/json' };
            
            // Añadir token de autenticación si está disponible
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            
            // Si el token expiró (401), intentar refrescar
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this._refreshAccessToken();
                if (refreshed) {
                    // Reintentar la petición con el nuevo token
                    headers['Authorization'] = `Bearer ${this.accessToken}`;
                    const retryResponse = await fetch(`${this.apiBase}${endpoint}`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body)
                    });
                    
                    if (!retryResponse.ok) return null;
                    
                    const contentType = retryResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        return await retryResponse.json();
                    }
                    
                    const text = await retryResponse.text();
                    return text.trim() === 'success' ? { success: true } : { success: false, message: text };
                }
            }
            
            if (!response.ok) return null;
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            }
            
            const text = await response.text();
            return text.trim() === 'success' ? { success: true } : { success: false, message: text };
        } catch (error) {
            console.error(`Error in ${endpoint}:`, error);
            return null;
        }
    }

    async _refreshAccessToken() {
        if (!this.refreshToken) return false;
        
        try {
            const response = await fetch(`${this.apiBase}/refreshToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            
            if (!response.ok) {
                // Refresh token inválido, hacer logout
                this.logout();
                return false;
            }
            
            const data = await response.json();
            if (data.accessToken) {
                this.accessToken = data.accessToken;
                localStorage.setItem('accessToken', data.accessToken);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return false;
        }
    }

    isAuthenticated() {
        return this.loggedIn;
    }

    getUser() {
        return this.isAuthenticated() ? this.user : null;
    }
    
    async register(user, email, pass) {
        return await this._request('/registerUser', { user, email, pass });
    }

    async getFollowingUsers() {
        if (!this.isAuthenticated()) return [];
        const data = await this._request('/getFollowing', this.getAuthPayload(), true);
        return data?.following || [];
    }

    async getFollowerNotes(limit = 20, offset = 0) {
        if (!this.isAuthenticated()) return [];
        const following = await this.getFollowingUsers();
        const data = await this._request('/getFollowerNotes', { 
            ...this.getAuthPayload(), 
            followingUsers: following, 
            limit, 
            offset 
        }, true);
        return data || [];
    }

    async checkLogin() {
        const { user, pass } = this;
        const endpoint = this.isDiscordAuth ? '/discordLogin' : '/login';
        const body = this.isDiscordAuth 
            ? { username: user, discordId: this.discordId }
            : { user, password: pass };
        
        return await this._request(endpoint, body);
    }

    async getPublicComments(noteId, limit = 20, offset = 0) {
        return await this._request('/getPublicComments', { 
            ...this.getAuthPayload(), 
            id: noteId, 
            limit, 
            offset 
        }) || [];
    }

    async comment(noteId, content) {
        if (!this.isAuthenticated()) return { success: false, message: 'Not authenticated' };
        
        try {
            const response = await fetch(`${this.apiBase}/sendComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, content })
            });
            
            if (response.status === 201) return { success: true };
            
            const data = await response.json().catch(() => ({ success: false }));
            return { success: !!data?.success, data };
        } catch (error) {
            console.error('Error sending comment:', error);
            return { success: false, error: String(error) };
        }
    }

    async canComment(noteId) {
        if (!this.isAuthenticated()) return false;
        const data = await this._request('/canComment', { ...this.getAuthPayload(), noteId }, true);
        return data?.canComment || false;
    }

    async getComments(noteId, limit = 20, offset = 0) {
        const data = await this._request('/getPrivateComments', { 
            ...this.getAuthPayload(), 
            id: noteId, 
            limit, 
            offset 
        });
        return data || [];
    }

    async isFollowing(user) {
        if (!this.isAuthenticated()) return false;
        const data = await this._request('/isFollowing', { ...this.getAuthPayload(), target: user }, true);
        return data?.isFollowing || false;
    }

    async followUser(targetUser) {
        if (!this.isAuthenticated()) return { success: false };
        const data = await this._request('/follow', { ...this.getAuthPayload(), target: targetUser }, true);
        return { success: data === 'success' || data?.success };
    }

    async unfollowUser(targetUser) {
        if (!this.isAuthenticated()) return { success: false };
        const data = await this._request('/deleteFollow', { ...this.getAuthPayload(), target: targetUser }, true);
        return { success: data === 'success' || data?.success };
    }

    async getMyNotes(limit = 20, offset = 0) {
        if (!this.isAuthenticated()) return [];
        return await this._request('/getNotes', { ...this.getAuthPayload(), limit, offset }, true) || [];
    }

    async getFriendNotes(limit = 20, offset = 0) {
        if (!this.isAuthenticated()) return [];
        return await this._request('/getFriendNotes', { ...this.getAuthPayload(), limit, offset }, true) || [];
    }

    async getFriends() {
        if (!this.isAuthenticated()) return [];
        const data = await this._request('/getFriends', this.getAuthPayload(), true);
        return data || [];
    }

    async areFriends(otherUser) {
        if (!this.isAuthenticated()) return false;
        const friends = await this.getFriends();
        return friends.includes(otherUser);
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('pass');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('discord_auth');
        this.user = '';
        this.pass = '';
        this.accessToken = '';
        this.refreshToken = '';
        this.loggedIn = false;
        location.reload();
    }

    saveLogin(tokens = null) {
        localStorage.setItem('user', this.user);
        
        if (tokens?.accessToken && tokens?.refreshToken) {
            // Autenticación con tokens (segura)
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            this.isTokenAuth = true;
        } else {
            // Autenticación legacy con contraseña
            localStorage.setItem('pass', this.pass);
        }
        
        this.loggedIn = true;
    }

    async createNote({ title, content, privacy }) {
        if (!this.isAuthenticated()) return null;
        
        try {
            const response = await fetch(`${this.apiBase}/sendNewNote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), title, content, privacy })
            });
            
            if (!response.ok) {
                const text = await response.text().catch(() => null);
                return { success: false, status: response.status, message: text };
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json();
            }

            const text = await response.text().catch(() => null);
            const maybeId = parseInt(text?.trim() || '');
            
            return !isNaN(maybeId) 
                ? { success: true, id: maybeId, message: text }
                : { success: true, message: text };
        } catch (error) {
            console.error('Error creating note:', error);
            return null;
        }
    }

    async getNote(id) {
        return await this._request('/getNote', { id, ...this.getAuthPayload() });
    }

    async getPublicNotes(id, limit = 20, offset = 0) {
        return await this._request('/getPublicNotes', { id, limit, offset }) || [];
    }

    async login(user, pass) { 
        this.user = user;
        this.pass = pass;
        const loginStatus = await this.checkLogin();
        
        if (loginStatus?.success) {
            // Si el backend devuelve tokens, usarlos
            if (loginStatus.accessToken && loginStatus.refreshToken) {
                this.saveLogin({
                    accessToken: loginStatus.accessToken,
                    refreshToken: loginStatus.refreshToken
                });
            } else {
                // Login legacy sin tokens
                this.saveLogin();
            }
        } else {
            this.logout();
        }
        
        return loginStatus;
    }

    async getFriendsFromAPI() {
        if (!this.isAuthenticated()) return { success: false, friends: [] };
        const data = await this._request('/getFriends', this.getAuthPayload(), true);
        return data || { success: false, friends: [] };
    }

    async getFollowers() {
        if (!this.isAuthenticated()) return { success: false, followers: [] };
        const data = await this._request('/getFollowers', this.getAuthPayload(), true);
        return data || { success: false, followers: [] };
    }

    async getFriendRequests() {
        if (!this.isAuthenticated()) return { success: false, requests: [] };
        const data = await this._request('/hasFriendRequests', this.getAuthPayload(), true);
        return data || { success: false, requests: [] };
    }

    async addFriendToAPI(targetUser) {
        if (!this.isAuthenticated()) return { success: false };
        return await this._request('/addFriend', { ...this.getAuthPayload(), friend: targetUser }, true) || { success: false };
    }

    async acceptFriendRequest(targetUser) {
        return this.addFriendToAPI(targetUser);
    }

    async deleteFriendFromAPI(targetUser) {
        if (!this.isAuthenticated()) return { success: false };
        return await this._request('/deleteFriend', { ...this.getAuthPayload(), friend: targetUser }, true) || { success: false };
    }

    async rejectFriendRequestFromAPI(targetUser) {
        if (!this.isAuthenticated()) return { success: false };
        return await this._request('/rejectFriendRequest', { ...this.getAuthPayload(), sender: targetUser }, true) || { success: false };
    }

    async getUserProfile(targetUser) {
        const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
        return await this._request('/getUserProfile', { ...payload, username: targetUser });
    }

    async getFollowStats(targetUser) {
        const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
        return await this._request('/getFollowStats', { ...payload, username: targetUser });
    }

    async searchMixed(query) {
        const data = await this._request('/searchMixed', { query });
        return data || { results: [], users: [], notes: [] };
    }

    async getFriendNotesFromAPI(limit = 20, offset = 0) {
        if (!this.isAuthenticated()) return [];
        return await this._request('/getFriendNotes', { ...this.getAuthPayload(), limit, offset }, true) || [];
    }

    async getNoteWithDetails(noteId) {
        const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
        return await this._request('/getNote', { ...payload, id: noteId });
    }

    async getUserNotes(targetUser, limit = 20, offset = 0) {
        return await this._request('/getNotes', { id: targetUser, limit, offset }) || [];
    }

    async getCommentsForNote(noteId, limit = 20, offset = 0) {
        try {
            const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
            let response = await this._privateGetPublicComments(noteId, limit, offset);
            
            if (!response) {
                return await this._request('/getPrivateComments', { ...payload, id: noteId, limit, offset }) || [];
            }
            
            return response || [];
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    async _privateGetPublicComments(noteId, limit = 20, offset = 0) {
        const payload = this.isAuthenticated() ? this.getAuthPayload() : {};
        return await this._request('/getPublicComments', { ...payload, id: noteId, limit, offset });
    }

    async addCommentToNote(noteId, commentText) {
        if (!this.isAuthenticated()) return { success: false };
        
        try {
            const response = await fetch(`${this.apiBase}/sendComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...this.getAuthPayload(), id: noteId, content: commentText })
            });
            
            return { success: response.ok };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false };
        }
    }

    async linkDiscordAccount(discordId) {
        if (!this.isAuthenticated()) return { success: false };
        return await this._request('/linkDiscord', { ...this.getAuthPayload(), discordId }, true) || { success: false };
    }

    async getProfilePic(target) {
        const data = await this._request('/getProfilePic', { target });
        return data || { url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${target}` };
    }
}

window.api = new apiLoader();