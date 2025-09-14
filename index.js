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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
