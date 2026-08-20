import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "@/application/ports/out/services";
import { invalidInput } from "@/domain/errors";

/**
 * Files live on a local volume; the database holds only metadata and ACLs.
 * Every key is re-resolved against the upload root so a crafted key cannot
 * escape it.
 */
export class LocalFileStorage implements FileStorage {
  private root() {
    return path.resolve(
      /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./data/uploads",
    );
  }

  private resolve(storageKey: string) {
    const root = this.root();
    const target = path.resolve(root, storageKey);
    if (!target.startsWith(`${root}${path.sep}`))
      throw invalidInput("Đường dẫn file không hợp lệ.");
    return target;
  }

  async write(storageKey: string, content: Uint8Array): Promise<void> {
    const target = this.resolve(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    // "wx" fails rather than overwriting an existing key.
    await writeFile(target, content, { flag: "wx" });
  }

  async read(storageKey: string): Promise<Uint8Array> {
    return readFile(/* turbopackIgnore: true */ this.resolve(storageKey));
  }
}
