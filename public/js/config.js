// Configuración de la aplicación Thinkverse
window.AppConfig = {
    // API
    apiUrl: 'https://api.thinkverse.site',
    
    // Discord OAuth (solo datos públicos)
    discord: {
        clientId: '1423988912522788927',
        redirectUri: 'https://thinkverse.site/discord-callback.html',
        scope: 'identify email'
    },
    
    // Otras configuraciones
    appName: 'Thinkverse',
    version: '1.0'
};

// Debug: verificar que se carga correctamente
console.log('✅ AppConfig loaded - Discord Client ID:', window.AppConfig.discord.clientId);
