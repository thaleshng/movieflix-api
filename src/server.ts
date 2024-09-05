import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.get("/movies/:genreName", async (req, res) => {
    const genreName = req.params.genreName;

    try {
        const genreExists = await prisma.movie.findFirst({
            where: {
                genres: {
                    name: {
                        equals: genreName,
                        mode: "insensitive",
                    },
                },
            },
        });

        if (!genreExists) {
            return res.status(404).send({
                message: "Nenhum filme com esse gênero foi encontrado",
            });
        }
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: genreName,
                        mode: "insensitive",
                    },
                },
            },
        });
        res.status(200).send(moviesFilteredByGenreName);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Falha ao filtrar os filmes por gênero",
        });
    }
});

app.get("/genres", async (req, res) => {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: {
                id: "asc",
            },
        });

        res.json(genres);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Houve um erro ao listar os gêneros" });
    }
});

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        });

        if (movieWithSameTitle) {
            return res.status(409).send({
                message: "Já existe um filme cadastrado com esse título",
            });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Falha ao cadastrar um filme" });
    }

    res.status(201).send();
});

app.post("/genres", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .send({ message: "O nome do gênero é obrigatório." });
    }

    try {
        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
        });

        if (existingGenre) {
            return res.status(409).send({
                message: "Já existe um gênero com esse nome",
            });
        }

        await prisma.genre.create({
            data: { name },
        });

        res.status(201).send({ message: "Gênero adicionado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Ocorreu um erro ao adicionar o gênero",
        });
    }
});

app.put("/movies/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const data = { ...req.body };
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        await prisma.movie.update({
            where: {
                id,
            },
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Falha ao atualizar o registro do filme",
        });
    }

    res.status(200).send();
});

app.put("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const data = { ...req.body };

        const genre = await prisma.genre.findUnique({
            where: { id },
        });

        if (!genre) {
            return res.status(404).send({ message: "Gênero não encontrado" });
        }

        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: data.name, mode: "insensitive" },
                id: { not: id },
            },
        });

        if (existingGenre) {
            return res
                .status(409)
                .send({ message: "Este nome de gênero já existe." });
        }

        await prisma.genre.update({
            where: {
                id,
            },
            data,
        });

        res.status(200).send({ message: "Gênero atualizado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Ocorreu um erro ao atualizar o gênero",
        });
    }
});

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res
                .status(404)
                .send({ message: "O filme não foi encontrado" });
        }

        await prisma.movie.delete({
            where: { id },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Ocorreu um erro ao deletar o filme" });
    }

    res.status(200).send();
});

app.listen(port, () => {
    console.log(`O servidor está em execução em http://localhost:${port}`);
});
