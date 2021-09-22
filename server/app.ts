import { Application, Router, Status } from "https://deno.land/x/oak/mod.ts";
import { ConfigService } from "../services/config.service.ts";
import * as stdPath from "https://deno.land/std@0.97.0/path/mod.ts";
import {
  compileHTML,
  compilePDF,
  DocType,
  getDefaultResume,
} from "resumerise_library/mod.ts";
import * as eta from "https://deno.land/x/eta@v1.6.0/mod.ts";
const __dirname = stdPath.dirname(stdPath.fromFileUrl(import.meta.url));
import { WebSocket } from "https://deno.land/std@0.105.0/ws/mod.ts";
import { escapeHtml } from "https://deno.land/x/escape@1.4.0/mod.ts";

import {
  WebSocketClient,
  WebSocketServer,
} from "https://deno.land/x/websocket@v0.1.1/mod.ts";

const app = new Application();
export const socks = new Array<WebSocket>();
const router = new Router();

const getLayout = async (
  targetPlatform: DocType | null,
  data: string | Uint8Array,
  title: string | undefined,
): Promise<string> => {
  const css = Deno.readTextFileSync(`${__dirname}/css/main.css`);
  const js = Deno.readTextFileSync(`${__dirname}/js/main.js`);
  const layout = Deno.readTextFileSync(
    `${__dirname}/templates/layout.eta`,
  );

  try {
    if (targetPlatform != "PRINT") {
      data = escapeHtml(data as string);
    }
    return await eta.render(layout, {
      css: css,
      js: js,
      title: title,
      type: targetPlatform?.toString().toUpperCase(),
      data,
    }) as string;
  } catch (e) {
    console.log(`Error while compiling layout tempalte: ${e}`);
    return "";
  }
};

router
  .get("/html", async (context) => {
    context.response.headers.set("Content-Type", "text/html");
    const type = context.request.url.searchParams.get("type") as DocType;
    const resume = await getDefaultResume();
    return await getLayout(
      type,
      await compileHTML(
        ConfigService.modulePath,
        resume,
        type,
      ),
      resume.basics?.label,
    ).then((result) => {
      context.response.body = result;
      context.response.status = 200;
    }, (error) => {
      console.log(`Error while compiling html ${error}`);
      context.response.body =
        "<p>Template could not be compiled. Please check the logs.</p>";
      context.response.status = Status.NoContent;
    });
  })
  .get("/pdf", async (context) => {
    const resume = await getDefaultResume();
    context.response.headers.set("Content-Type", "text/html");
    return compilePDF(
      ConfigService.modulePath,
      resume,
      import.meta.url,
    ).then((pdfData) => {
      return getLayout("PRINT", pdfData, resume?.basics?.label);
    }).then((compileHTML) => {
      context.response.status = Status.OK;
      context.response.body = compileHTML;
    }).catch((error) => {
      console.log(`Error while compiling html ${error}`);
      context.response.body =
        "<p>Template could not be compiled. Please check the logs.</p>";
      context.response.status = Status.NoContent;
    });
  });

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
