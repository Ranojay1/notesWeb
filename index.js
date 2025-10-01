const config = require('./config.json');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = config.port || 3001;
app.use(express.static('public'));

for(const file of fs.readdirSync('./public/html').filter(f => f.endsWith('.html'))) {
    const route = file.includes("index") ? "/" : "/"+file.replace('.html', '');

    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'html', file));
    });
}
let lastVersion;
app.get("/download", (req, res) => {
    if(!lastVersion) {
        for(const file of fs.readdirSync('./public/apk').filter(f => f.endsWith('.apk'))) {
            const version = file.replace('NotesApp_v', '').replace('.apk', '');
            if (version > lastVersion || !lastVersion) {
                lastVersion = version;
            }
            console.log(version)
        }
    }
    const file = path.join(__dirname, 'public', 'apk', 'NotesApp_v' + lastVersion + '.apk');
    res.download(file);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
