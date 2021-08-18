import { Application, Router, Status } from "https://deno.land/x/oak/mod.ts";
import { ConfigService } from "../services/config.service.ts";
import * as stdPath from "https://deno.land/std@0.97.0/path/mod.ts";
import {
  compileHTML,
  compilePDF,
  getDefaultResume,
} from "resumerise_library/mod.ts";
import * as eta from "https://deno.land/x/eta@v1.6.0/mod.ts";
import { DocType } from "https://deno.land/x/resumerise_library/mod.ts";
const __dirname = stdPath.dirname(stdPath.fromFileUrl(import.meta.url));
import { WebSocket } from "https://deno.land/std@0.105.0/ws/mod.ts";

const app = new Application();
export const socks = new Array<WebSocket>();
const router = new Router();

const getLayout = async (
  targetPlatform: string | null,
  data: string | Uint8Array,
  title: string | undefined,
) => {
  const css = Deno.readTextFileSync(`${__dirname}/css/main.css`);
  const js = Deno.readTextFileSync(`${__dirname}/js/main.js`);
  const layout = Deno.readTextFileSync(
    `${__dirname}/templates/layout.eta`,
  );

  try {
    const result = await eta.render(layout, {
      css: css,
      js: js,
      title: title,
      type: targetPlatform,
      data,
    }) as string;
    return result;
  } catch (e) {
    console.log(`Error while compiling layout tempalte: ${e}`);
    return "";
  }
};

router
  .get("/html", async (context) => {
    const targetPlatform = context.request.url.searchParams.get("type");
    const resume = getDefaultResume();
    context.response.status = Status.OK;
    context.response.body = await getLayout(
      targetPlatform,
      await compileHTML(
        ConfigService.modulePath,
        getDefaultResume(),
        DocType.HTML,
      ),
      resume.basics?.label,
    );
  })
  .get("/pdf", async (context) => {
    context.response.status = Status.OK;
    const resume = getDefaultResume();
    const pdfStream = await compilePDF(
      ConfigService.modulePath,
      getDefaultResume(),
    );
    context.response.body = await getLayout(
      DocType.PDF.toString(),
      pdfStream,
      resume.basics?.label,
    );
  });

import {
  WebSocketClient,
  WebSocketServer,
} from "https://deno.land/x/websocket@v0.1.1/mod.ts";

const wss = new WebSocketServer(8080);
wss.on("connection", function (ws: WebSocketClient) {
  const watcher = Deno.watchFs([
    `${__dirname}/templates`,
    `${__dirname}/css`,
  ]);
  async function main() {
    for await (const event of watcher) {
      console.log(`Paths has changed: ${event.paths}`);
      if (!ws.isClosed) ws.send("update");
    }
  }
  main();
});

app.use(router.routes());
app.use(router.allowedMethods());

export default app;
