/**
 * NAPAS bank codes → the name a shopper would recognise.
 *
 * PayOS returns the destination account as a 6-digit BIN, which is exactly what
 * a banking app needs and exactly what nobody can read. This map is only for
 * display; anything missing falls back to the raw code rather than guessing.
 */
const BANKS: Record<string, string> = {
  "970400": "SaigonBank",
  "970403": "Sacombank",
  "970405": "Agribank",
  "970406": "DongA Bank",
  "970407": "Techcombank",
  "970409": "BacA Bank",
  "970412": "PVcomBank",
  "970414": "MBV",
  "970415": "VietinBank",
  "970416": "ACB",
  "970418": "BIDV",
  "970419": "NCB",
  "970422": "MB Bank",
  "970423": "TPBank",
  "970424": "Shinhan Bank",
  "970425": "ABBANK",
  "970426": "MSB",
  "970427": "VietABank",
  "970428": "Nam A Bank",
  "970429": "SCB",
  "970430": "PGBank",
  "970431": "Eximbank",
  "970432": "VPBank",
  "970433": "VietBank",
  "970436": "Vietcombank",
  "970437": "HDBank",
  "970438": "BaoViet Bank",
  "970440": "SeABank",
  "970441": "VIB",
  "970442": "Hong Leong Bank",
  "970443": "SHB",
  "970446": "Co-opBank",
  "970448": "OCB",
  "970449": "LPBank",
  "970452": "KienlongBank",
  "970454": "BVBank",
  "970457": "Woori Bank",
  "546034": "Cake by VPBank",
  "546035": "Ubank by VPBank",
  "963388": "Timo",
};

export const bankName = (bin: string) => BANKS[bin] ?? `Ngân hàng ${bin}`;
