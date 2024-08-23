import express from "express";

const port = 3000;
const app = express();

app.get("/filmes", (req, res) => {
    res.send("Listagem de Filmes");
});

app.listen(port, () => {
    console.log(`O servidor está em execução em http://localhost:${port}`);
});
