import app from "../server/app.ts";
import { open } from "opener/mod.ts";

export class UtilsService {
  async startApp() {
    app.addEventListener("listen", async ({ hostname, port, secure }) => {
      const previewUrl = "http://localhost:3000/html?type=DESKTOP";
      console.log(`server has started on ${previewUrl} 🚀`);
      console.log("Happy coding !");
      await open(previewUrl);
    });

    await app.listen({ port: 3000 });
  }
}
