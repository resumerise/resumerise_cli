import { Application, Router, Status } from "oak/mod.ts";
import { ConfigService } from "../services/config.service.ts";
import {
  compileHTML,
  compilePDF,
  DocType,
  getDefaultResume,
  getFileContent,
} from "resumerise_library/mod.ts";
import * as eta from "eta/mod.ts";
import { WebSocket } from "ws/mod.ts";
import { escapeHtml } from "escapeHtml/mod.ts";

const app = new Application();
export const socks = new Array<WebSocket>();
const router = new Router();

const getLayout = async (
  targetPlatform: DocType | null,
  data: string | Uint8Array,
  title: string | undefined,
): Promise<string> => {
  const css = await getFileContent("./css/main.css", import.meta.url);
  const js = await getFileContent("./js/main.js", import.meta.url);
  const layout = await getFileContent(
    "./templates/layout.eta",
    import.meta.url,
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

app.use(router.routes());
app.use(router.allowedMethods());

export default app;
