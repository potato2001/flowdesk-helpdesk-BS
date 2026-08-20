import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_PASSWORD_LENGTH,
  checkPassword,
  isStrongPassword,
} from "../../domain/user/password-policy.ts";

test("length is checked before composition", () => {
  assert.match(checkPassword("Aa1!"), /ít nhất 12 ký tự/);
  assert.equal("Aa1!".length < MIN_PASSWORD_LENGTH, true);
});

test("each missing character class reports its own rule", () => {
  assert.match(checkPassword("ALLUPPER123!"), /chữ thường/);
  assert.match(checkPassword("alllower123!"), /chữ hoa/);
  assert.match(checkPassword("NoDigitsHere!"), /chữ số/);
  assert.match(checkPassword("NoSymbols1234"), /ký tự đặc biệt/);
});

test("a compliant password passes", () => {
  assert.equal(checkPassword("Flowdesk@1234"), null);
  assert.equal(isStrongPassword("Flowdesk@1234"), true);
});

test("an over-long password is rejected", () => {
  assert.match(checkPassword(`Aa1!${"x".repeat(300)}`), /quá dài/);
});
