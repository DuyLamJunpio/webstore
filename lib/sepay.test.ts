/**
 * Run with `npm test`.
 *
 * The first memo is the shape SePay delivered for a real TPBank test order
 * (names and account numbers replaced): no SePay pattern matched, so `code`
 * arrived null although the memo carried the payment code intact.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { Order, OrderPayment } from "./orders";
import { findSepayOrder, getSepayBankAccount, sepayPaymentRefs, type SepayWebhook } from "./sepay";

const config = { apiKey: "test-key", paymentPrefix: "TBC" };

const transfer = (fields: Partial<SepayWebhook>): SepayWebhook => ({
  id: 84458405,
  transferType: "in",
  transferAmount: 3250,
  code: null,
  content: null,
  ...fields,
});

test("finds the order ref in the memo when SePay could not recognise a code", () => {
  const refs = sepayPaymentRefs(
    transfer({
      content:
        "MBVCB.16220089552.6268BFTVGL1LMZNM.TBCSBGRY6WMQM.CT tu 0123456789 NGUYEN VAN A toi 0987654321 CUA HANG tai TPBANK",
    }),
    config,
  );

  assert.deepEqual(refs, ["SBGRY6WMQM"]);
});

test("puts SePay's own code first and does not repeat it", () => {
  const refs = sepayPaymentRefs(
    transfer({ code: "TBCK7M2P9QX4R", content: "TBCSBGRY6WMQM TBCK7M2P9QX4R chuyen tien" }),
    config,
  );

  assert.deepEqual(refs, ["K7M2P9QX4R", "SBGRY6WMQM"]);
});

test("keeps exactly one ref's worth of characters when the text runs on", () => {
  const refs = sepayPaymentRefs(
    transfer({ code: "TBCSBGRY6WMQMCT", content: "TBCSBGRY6WMQMCT TU NGUYEN VAN A" }),
    config,
  );

  assert.deepEqual(refs, ["SBGRY6WMQM"]);
});

test("reads a code typed by hand with spaces, dashes or lower case", () => {
  for (const content of ["tbc sbgry6wmqm", "TBC-SBGRY6WMQM", "Tbc.Sbgry6wmqm thanh toan"]) {
    assert.deepEqual(sepayPaymentRefs(transfer({ content }), config), ["SBGRY6WMQM"], content);
  }
});

test("also reads the bank's full notification text", () => {
  const refs = sepayPaymentRefs(
    transfer({ content: "CHUYEN TIEN", description: "TK 0987654321 +3,250VND ND TBCSBGRY6WMQM" }),
    config,
  );

  assert.deepEqual(refs, ["SBGRY6WMQM"]);
});

test("does not let a repeated prefix crowd out the real code", () => {
  const refs = sepayPaymentRefs(transfer({ content: `${"TBC".repeat(4)}SBGRY6WMQM` }), config);

  assert.equal(refs[0], "SBGRY6WMQM", JSON.stringify(refs));
});

test("tries the code written as its own word before look-alikes inside longer runs", () => {
  const refs = sepayPaymentRefs(
    transfer({ content: "TBC2222222222TBC3333333333TBC4444444444 TBCSBGRY6WMQM" }),
    config,
  );

  assert.equal(refs[0], "SBGRY6WMQM", JSON.stringify(refs));
});

test("ignores transfers that carry no code for this shop", () => {
  for (const content of ["QR - chuyen khoan nhanh qua Zalo", "DHSBGRY6WMQM", "TBCSBGRY"]) {
    assert.deepEqual(sepayPaymentRefs(transfer({ content }), config), [], content);
  }
});

test("follows the configured prefix", () => {
  const refs = sepayPaymentRefs(
    transfer({ content: "ABCSBGRY6WMQM TBCK7M2P9QX4R" }),
    { ...config, paymentPrefix: "ABC" },
  );

  assert.deepEqual(refs, ["SBGRY6WMQM"]);
});

test("looks at no more than a handful of candidates", () => {
  const content = Array.from({ length: 8 }, (_, i) => `TBC${String(i + 2).repeat(10)}`).join(" ");

  assert.equal(sepayPaymentRefs(transfer({ content }), config).length, 3);
});

const stored = (ref: string, payment: Partial<OrderPayment> = {}) =>
  ({ ref, payment: { provider: "sepay", description: `TBC${ref}`, ...payment } }) as Order;

test("settles the first candidate that is a stored order waiting for that code", async () => {
  const orders: Record<string, Order> = { HQ7NW3XKPA: stored("HQ7NW3XKPA"), SBGRY6WMQM: stored("SBGRY6WMQM") };

  const order = await findSepayOrder(
    ["ZZZZZZZZZZ", "SBGRY6WMQM", "HQ7NW3XKPA"],
    config,
    async (ref) => orders[ref] ?? null,
  );

  assert.equal(order?.ref, "SBGRY6WMQM");
});

test("skips orders that are not waiting for this SePay code", async () => {
  const orders: Record<string, Order> = {
    HQ7NW3XKPA: stored("HQ7NW3XKPA", { provider: "cod", description: "" }),
    SBGRY6WMQM: stored("SBGRY6WMQM", { description: "ABCSBGRY6WMQM" }),
  };

  const order = await findSepayOrder(["HQ7NW3XKPA", "SBGRY6WMQM"], config, async (ref) => orders[ref] ?? null);

  assert.equal(order, null);
});

test("lets a failed lookup through, so the webhook answers 500 and SePay retries", async () => {
  await assert.rejects(
    findSepayOrder(["SBGRY6WMQM"], config, async () => {
      throw new Error("HTTP 502");
    }),
    /HTTP 502/,
  );
});

test("reads the recipient account through SePay's API-token endpoint", async () => {
  const requested: string[] = [];
  const realFetch = globalThis.fetch;
  const realEnv = { ...process.env };
  process.env.SEPAY_API_ACCESS_TOKEN = "test-token";
  delete process.env.SEPAY_BANK_ACCOUNT_ID;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    requested.push(String(input));
    return Response.json({
      status: 200,
      bankaccounts: [
        {
          id: "1",
          active: "0",
          account_holder_name: "TAI KHOAN CU",
          account_number: "0123456789",
          bank_short_name: "MBBank",
          bank_bin: "970422",
        },
        {
          id: "2",
          active: "1",
          account_holder_name: "CUA HANG",
          account_number: "0987654321",
          bank_short_name: "TPBank",
          bank_full_name: "Ngân hàng TMCP Tiên Phong",
          bank_bin: "970423",
        },
      ],
    });
  };

  try {
    const bank = await getSepayBankAccount();

    assert.equal(requested[0], "https://my.sepay.vn/userapi/bankaccounts/list");
    assert.deepEqual(bank, {
      bin: "970423",
      accountNumber: "0987654321",
      accountName: "CUA HANG",
      bankName: "TPBank",
    });
  } finally {
    globalThis.fetch = realFetch;
    process.env = realEnv;
  }
});
