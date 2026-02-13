import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { routes } from "./routes/main.js";

const server = express();
server.use(cors());
server.use(express.static("public"));

// Stripe does not send a JSON on body requests, so we need an exception for it
server.use("/webhook/stripe", express.raw({ type: "application/json" }));
// The rest of the API can use JSON normally
server.use(express.json());

server.use(routes);

server.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
