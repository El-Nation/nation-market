import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Nation-Market Backend API Running Successfully.');
});

app.listen(PORT, () => {
    console.log(`Backend server successfully listening on port ${PORT}`);
});
