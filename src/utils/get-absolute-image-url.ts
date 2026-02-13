import { getBaseURL } from "./get-base-url";

export function getAbsoluteImageUrl(path: string) {
  return `${getBaseURL()}/${path}`;
}
