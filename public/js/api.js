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


    async getFollowerNotes() {
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getFollowerNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: this.user, password: this.pass, followingUsers: await this.getFollowingUsers() })
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

    async getMyNotes(){
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: this.user, password: this.pass })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my notes:', error);
            return [];
        }
    }

    async getFriendNotes(){
        if(!this.isAuthenticated()) return [];
        try {
            const response = await fetch(this.apiBase + '/getFriendNotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: this.user, password: this.pass })
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

    async getPublicNotes(id) {
        const body = JSON.stringify({ id });
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