/**
 * Script de migración: Discord ID inseguro → JWT Tokens seguros
 * Se ejecuta automáticamente al cargar la app
 */

(async function migrateDiscordAuth() {
    const pass = localStorage.getItem('pass');
    const user = localStorage.getItem('user');
    const discordAuth = localStorage.getItem('discord_auth');
    
    // Detectar usuarios con autenticación Discord legacy (insegura)
    if (pass && pass.startsWith('DISCORD_') && discordAuth && user) {
        console.log('🔄 Migrating Discord auth to secure JWT tokens...');
        
        const discordId = pass.replace('DISCORD_', '');
        
        try {
            // Obtener tokens JWT del backend
            const response = await fetch('https://api.thinkverse.site/api/discordLogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user,
                    discordId: discordId
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.accessToken && result.refreshToken) {
                // Actualizar a tokens seguros
                localStorage.setItem('accessToken', result.accessToken);
                localStorage.setItem('refreshToken', result.refreshToken);
                localStorage.removeItem('pass'); // Eliminar Discord ID inseguro
                
                console.log('✅ Migration successful! Your account is now secured with JWT tokens.');
                console.log('🔐 Discord ID has been removed from local storage.');
            } else {
                console.warn('⚠️ Migration failed:', result.error);
                console.warn('Please log out and log in again with Discord.');
            }
        } catch (error) {
            console.error('❌ Migration error:', error);
        }
    }
})();
