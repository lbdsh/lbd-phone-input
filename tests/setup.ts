import { beforeAll } from "vitest";

beforeAll(() => {
  if (!HTMLElement.prototype.scrollIntoView) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  }
});
