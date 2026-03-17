const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/auth/register", (req, res) => {
    console.log("Received:", req.body);
    res.json({ message: "Backend is receiving data!" });
});

app.listen(3001, () => {
    console.log(`Server is running on http://localhost:3001`);
});