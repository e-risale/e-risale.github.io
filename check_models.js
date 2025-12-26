const https = require('https');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("API_KEY not found in env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                const names = json.models.map(m => `${m.name.split('/').pop()} | ${m.displayName}`).join('\n');
                fs.writeFileSync('models_output.txt', names);
                console.log("Written to models_output.txt");
            } else {
                fs.writeFileSync('models_output.txt', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            fs.writeFileSync('models_output.txt', "Error: " + e.message + "\nData: " + data);
        }
    });
}).on('error', (e) => {
    fs.writeFileSync('models_output.txt', "Request Error: " + e.message);
});
