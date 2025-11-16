const config = require('./config.json');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = config.port || 3001;

app.use(express.static('public'));

const htmlFiles = fs.readdirSync('./public/html').filter(f => f.endsWith('.html'));
const apkFiles = fs.readdirSync('./public/apk').filter(f => f.endsWith('.apk'));

let latestVersion = null;

for (const file of htmlFiles) {
    const route = file.includes('index') ? '/' : `/${file.replace('.html', '')}`;
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'html', file));
    });
}

app.get('/download', (req, res) => {
    if (!latestVersion) {
        latestVersion = apkFiles.reduce((latest, file) => {
            const version = file.replace('NotesApp_v', '').replace('.apk', '');
            return version > latest ? version : latest;
        }, '0');
    }
    
    res.download(path.join(__dirname, 'public', 'apk', `NotesApp_v${latestVersion}.apk`));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
