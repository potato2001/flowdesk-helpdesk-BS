/**
 * Real-browser verification of the admin panel.
 *
 * A curl check reports 200 on the HTML shell even when every JS chunk 404s and
 * the app never hydrates — and it cannot catch an inert form (Base UI buttons
 * without type="submit" submitted nothing while every API call stayed green).
 * This drives an actual browser instead: login, every sidebar screen, a detail
 * dialog, a real write, logout — failing if any console error or failed API
 * request appears along the way.
 *
 * Usage: node scripts/verify-ui.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EMAIL = process.env.VERIFY_EMAIL ?? "admin@bravestars.local";
const PASSWORD = process.env.VERIFY_PASSWORD ?? "Flowdesk@123";
const OUT = "scratch/ui-verify";

/** Sidebar label → the <h1> that screen must render. */
const SCREENS = [
  ["Tổng quan", "Chào buổi sáng"],
  ["Bảng công việc", "Bảng công việc"],
  ["Tất cả ticket", "Tất cả ticket"],
  ["Cổng nhân viên", "Cổng nhân viên"],
  ["Toàn bộ ticket", "Toàn bộ ticket"],
  ["Chính sách SLA", "Chính sách SLA"],
  ["Tài khoản & phân quyền", "Tài khoản & phân quyền"],
  ["Nhật ký hoạt động", "Nhật ký hoạt động"],
];

const steps = [];
const consoleErrors = [];
const failedRequests = [];
const abortedRequests = [];

function step(name, detail = "") {
  steps.push({ name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exitCode = 1;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

page.on("console", (event) => {
  if (event.type() === "error") consoleErrors.push(event.text());
});
page.on("requestfailed", (request) => {
  const reason = request.failure()?.errorText ?? "unknown";
  // An aborted request is TanStack Query cancelling an in-flight fetch when
  // the screen changes — the cancellation feature working, not a failure.
  if (reason === "net::ERR_ABORTED") {
    abortedRequests.push(`${reason} ${request.url()}`);
    return;
  }
  failedRequests.push(`${reason} ${request.url()}`);
});
page.on("response", (response) => {
  const url = response.url();
  // 401 on /api/auth/me before login is the app's normal probe, not a defect.
  if (response.status() >= 400 && url.includes("/api/") && !url.endsWith("/api/auth/me"))
    failedRequests.push(`${response.status()} ${url}`);
});

try {
  await mkdir(OUT, { recursive: true });

  // ---- login -------------------------------------------------------------
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20_000,
  });
  await page.waitForSelector("h1", { timeout: 20_000 });
  step("đăng nhập", await page.url());

  // A stuck shell renders the loading brand forever; assert it cleared.
  if (await page.locator(".app-loading").count())
    fail("ứng dụng kẹt ở màn hình loading sau khi đăng nhập");

  // ---- sweep every sidebar screen ---------------------------------------
  for (const [label, heading] of SCREENS) {
    await page.click(`aside button:has(span:text-is("${label}"))`);
    await page.waitForSelector(`h1:has-text("${heading}")`, { timeout: 15_000 });
    await page.waitForTimeout(400);
    step(`màn hình "${label}"`, `h1 = ${heading}`);
  }

  // ---- filter dropdowns show labels, not raw values ---------------------
  // Base UI renders the raw value when `items` is missing, so a sentinel like
  // "__any__" leaks into the trigger. Only a rendered page catches this.
  await page.click(`aside button:has(span:text-is("Tài khoản & phân quyền"))`);
  await page.waitForSelector('h1:has-text("Tài khoản")');
  await page.waitForSelector('[data-slot="select-trigger"]', { timeout: 10_000 });
  const triggerText = await page
    .locator('[data-slot="select-trigger"]')
    .allInnerTexts();
  const leaked = triggerText.filter((text) => text.includes("__"));
  if (leaked.length)
    fail(`dropdown hiển thị giá trị thô thay vì nhãn: ${leaked.join(", ")}`);
  step("dropdown lọc hiển thị nhãn", triggerText.slice(0, 3).join(" | "));

  // ---- a detail dialog populates ----------------------------------------
  await page.click(`aside button:has(span:text-is("Chính sách SLA"))`);
  await page.waitForSelector('h1:has-text("Chính sách SLA")');
  await page.waitForSelector("table tbody tr", { timeout: 15_000 });
  const rowCount = await page.locator("table tbody tr").count();
  step("bảng SLA có dữ liệu", `${rowCount} dòng`);

  await page.click('table tbody tr:first-child button:has-text("Chỉnh sửa")');
  const dialog = page.locator('[data-slot="dialog-content"]');
  await dialog.waitFor({ timeout: 10_000 });
  const seeded = await page.inputValue("#sla-response");
  if (!seeded) fail("dialog SLA mở nhưng không được seed giá trị");
  step("dialog chi tiết mở và có giá trị", `phản hồi = ${seeded} phút`);

  // ---- a real write through the UI --------------------------------------
  const next = String(Number(seeded) === 30 ? 35 : 30);
  await page.fill("#sla-response", next);
  await page.click('[data-slot="dialog-content"] button[type="submit"]');
  await page.waitForSelector("[data-sonner-toast]", { timeout: 15_000 });
  const toast = (await page.locator("[data-sonner-toast]").first().innerText())
    .trim()
    .replace(/\s+/g, " ");
  step("ghi thật qua UI", `toast: ${toast}`);

  await dialog.waitFor({ state: "detached", timeout: 10_000 });
  // The table must reflect the write without a manual reload — this is what
  // proves the mutation's query invalidation actually fired.
  await page.waitForFunction(
    (minutes) => {
      const cell = document.querySelector("table tbody tr:first-child");
      return cell?.textContent?.includes(minutes);
    },
    next < 60 ? `${next} phút` : next,
    { timeout: 15_000 },
  );
  step("bảng tự cập nhật sau mutation", `${next} phút`);

  // ---- dark mode round-trips --------------------------------------------
  const toggle = page.locator('button[aria-label*="giao diện"]');
  await toggle.click();
  await page.waitForFunction(
    () => document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 8_000 },
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/dark.png`, fullPage: true });
  step("chế độ tối bật được", "html.dark");
  await toggle.click();
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 8_000 },
  );
  step("quay lại chế độ sáng");

  // ---- the dashboard chart renders real bars ----------------------------
  await page.click(`aside button:has(span:text-is("Tổng quan"))`);
  await page.waitForSelector("h1", { timeout: 10_000 });
  await page.waitForSelector(".recharts-surface", { timeout: 10_000 });
  const bars = await page.locator(".recharts-bar-rectangle").count();
  step("biểu đồ Recharts render", `${bars} cột`);

  // ---- screenshot as evidence -------------------------------------------
  await page.click(`aside button:has(span:text-is("Tổng quan"))`);
  await page.waitForSelector("h1", { timeout: 10_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });
  await page.click(`aside button:has(span:text-is("Tài khoản & phân quyền"))`);
  await page.waitForSelector('h1:has-text("Tài khoản")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/users.png`, fullPage: true });
  step("chụp màn hình", `${OUT}/dashboard.png, ${OUT}/users.png`);

  // ---- dragging a kanban card must not open the detail view --------------
  // loadTicketDetails used to select the ticket unconditionally, so a drop
  // navigated away from the board.
  await page.click(`aside button:has(span:text-is("Bảng công việc"))`);
  await page.waitForSelector('h1:has-text("Bảng công việc")', { timeout: 15_000 });
  const card = page.locator(".ticket-card").first();
  await card.waitFor({ timeout: 15_000 });
  const columns = page.locator(".column");
  const target = columns.nth(1);
  await card.dragTo(target);
  await page.waitForTimeout(2500);
  const stillOnBoard = await page
    .locator('h1:has-text("Bảng công việc")')
    .count();
  if (!stillOnBoard)
    fail("kéo thả ticket đã chuyển sang màn hình chi tiết thay vì ở lại bảng");
  step("kéo thả kanban giữ nguyên bảng");

  // ---- account actions live in the profile menu --------------------------
  if (await page.locator('header button:has-text("Đăng xuất")').count())
    fail('"Đăng xuất" vẫn nằm trên thanh trên cùng thay vì trong menu tài khoản');
  await page.click('button[aria-label="Menu tài khoản"]');
  await page.waitForSelector('[role="menu"]', { timeout: 8_000 });
  const menuText = await page.locator('[role="menu"]').innerText();
  for (const label of ["Đổi mật khẩu", "Đăng xuất"])
    if (!menuText.includes(label)) fail(`menu tài khoản thiếu "${label}"`);
  step("menu tài khoản chứa hành động", menuText.replace(/\s+/g, " ").trim());

  // ---- logout ------------------------------------------------------------
  await page.click('[role="menu"] >> text=Đăng xuất');
  await page.waitForURL("**/login", { timeout: 15_000 });
  step("đăng xuất", "quay về /login");
} catch (error) {
  fail(`bước thất bại: ${error.message}`);
  await page.screenshot({ path: `${OUT}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\nBước hoàn thành: ${steps.length}`);
console.log(`Console errors:  ${consoleErrors.length}`);
console.log(`Request lỗi:     ${failedRequests.length}`);
console.log(`Request bị hủy:  ${abortedRequests.length} (query cancellation, không tính là lỗi)`);
for (const line of consoleErrors.slice(0, 10)) console.log(`  console: ${line}`);
for (const line of failedRequests.slice(0, 10)) console.log(`  network: ${line}`);

if (consoleErrors.length || failedRequests.length) {
  fail("có console error hoặc request lỗi");
}
if (process.exitCode) console.error("\nKẾT QUẢ: THẤT BẠI");
else console.log("\nKẾT QUẢ: ĐẠT");
