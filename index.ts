import programService from "./services/program.service.ts";

if (import.meta.main) {
  programService.init();
}
