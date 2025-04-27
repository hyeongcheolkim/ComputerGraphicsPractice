import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use('/resource', express.static(path.join(__dirname, 'resource')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'resource', 'index.html'));
});

app.get('/proj1', (req, res) => {
    res.sendFile(path.join(__dirname, 'resource', 'proj1', 'proj1', 'proj1.html'));
});

app.get('/proj2', (req, res) => {
    res.sendFile(path.join(__dirname, 'resource', 'proj2', 'proj2.html'));
});

app.get('/proj3', (req, res) => {
    res.sendFile(path.join(__dirname, 'resource', 'proj3', 'src', 'proj3.html'));
});

app.listen(port, () => {
    console.log('Server is running on http://localhost:3000');
});