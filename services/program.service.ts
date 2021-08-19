import { UtilsService } from "./utils.service.ts";
import { Program } from "https://deno.land/x/program@0.1.6/mod.ts";
import { ConfigService } from "./config.service.ts";

export class ProgramService {
  private readonly utilsService: UtilsService;

  constructor() {
    this.utilsService = new UtilsService();
  }

  port = 5000;
  program!: Program;

  init() {
    this.program = new Program({
      name: "resumerise-cli",
      description: "CLI for resumerise",
      version: "0.0.1",
    });

    this.program
      .command({
        name: "serve",
        description: `Serve resume in live browser`,
        fn: (arg) => {
          ConfigService.modulePath = arg._[0] as string;
          this.utilsService.startApp();
        },
      })
      .argument({
        name: "themePath",
        multiple: false,
        optional: false,
        description: "URL or local path to theme path.",
      });

    this.program.parse(Deno.args);
  }
}

export default new ProgramService();
