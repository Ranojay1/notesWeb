class apiLoader {
    constructor() {
        // Centraliza la URL base de la API aquí
        this.apiBase = 'https://api.notas.cubenet.fun/api';
        //this.load();
    }
    async load() {
        this.user = localStorage.getItem('user') || ''; 
        this.pass = localStorage.getItem('pass') || ''; 
        if(!this.user || !this.pass) this.loggedIn = false;
        else {
            const loginStatus = await this.checkLogin();
            this.loggedIn = !!(loginStatus && loginStatus.success);
            if(!this.loggedIn) this.logout();
        }

        return this;
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
                body: JSON.stringify({ user: this.user, password: this.pass })
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
                body: JSON.stringify({ user: this.user, password: this.pass, followingUsers: following, limit, offset })
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
                body: JSON.stringify({ user: this.user, password: this.pass, id: noteId, limit, offset })
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
                body: JSON.stringify({ user: this.user, password: this.pass, id: noteId, content })
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
                body: JSON.stringify({ user: this.user, password: this.pass, noteId })
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
                body: JSON.stringify({ user: this.user, password: this.pass, id: noteId, limit, offset })
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
                body: JSON.stringify({ user: this.user, password: this.pass, target: user })
            });
            const data = (await response.json()).isFollowing;
            return data;
        } catch (error) {
            console.error('Error checking following status:', error);
            return false;
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
                body: JSON.stringify({ user: this.user, password: this.pass, limit, offset })
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
                body: JSON.stringify({ user: this.user, password: this.pass, limit, offset })
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
                body: JSON.stringify({ user: this.user, password: this.pass })
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
                body: JSON.stringify({ user: this.user, password: this.pass, title, content, privacy })
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
        const body = JSON.stringify({ id, user: this.user, password: this.pass });
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
}
window.api = new apiLoader();