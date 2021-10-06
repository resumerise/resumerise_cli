import app from "../server/app.ts";

export class UtilsService {
  async startApp() {
    app.addEventListener("listen", ({ hostname, port, secure }) => {
      console.log("server has started on http://localhost:3000/html 🚀");
      console.log("Happy coding !");
    });

    await app.listen({ port: 3000 });
  }
}
