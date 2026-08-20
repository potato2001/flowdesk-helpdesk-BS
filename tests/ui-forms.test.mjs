import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

/**
 * Base UI's Button does NOT default to type="submit" the way a native <button>
 * does — an omitted type silently makes the button inert inside a form. Every
 * Button must therefore declare its type explicitly.
 */
/**
 * A JSX tag cannot be matched with a flat regex: props such as
 * `onClick={() => ...}` contain `>` characters. Scan for the `>` that closes
 * the tag at brace depth zero instead.
 */
function* buttonTags(source) {
  for (const match of source.matchAll(/<Button\b/g)) {
    let depth = 0;
    for (let i = match.index; i < source.length; i += 1) {
      const char = source[i];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      else if (char === ">" && depth === 0) {
        yield source.slice(match.index, i + 1);
        break;
      }
    }
  }
}

const FILES = [
  "app/login/page.tsx",
  "app/page.tsx",
  "components/PasswordModal.tsx",
  "components/admin/AdminUsers.tsx",
  "components/admin/AdminSlaPolicies.tsx",
  "components/admin/AdminTickets.tsx",
  "components/admin/AdminAuditLog.tsx",
  "components/admin/DataTable.tsx",
  "components/admin/FormDialog.tsx",
];

test("every shadcn Button declares an explicit type", async () => {
  for (const file of FILES) {
    const source = await read(file);
    for (const tag of buttonTags(source)) {
      assert.match(
        tag,
        /type="(submit|button|reset)"/,
        `${file}: <Button> without an explicit type — Base UI will not submit the form:\n${tag}`,
      );
    }
  }
});

test("each form's primary action is a submit button", async () => {
  const expected = [
    ["app/login/page.tsx", "Đăng nhập"],
    ["components/PasswordModal.tsx", "Đổi mật khẩu"],
    ["components/admin/FormDialog.tsx", "hành động chính của dialog"],
    ["app/page.tsx", "Tạo ticket"],
  ];
  for (const [file, label] of expected) {
    const source = await read(file);
    const submits = [...buttonTags(source)].filter((tag) =>
      tag.includes('type="submit"'),
    );
    assert.ok(
      submits.length > 0,
      `${file} has no submit button for "${label}"`,
    );
  }
});
