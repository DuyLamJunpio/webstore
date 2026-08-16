This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Thanh toán (PayOS)

Khách mua không cần tài khoản. Luồng thanh toán là chuyển khoản ngân hàng qua VietQR:

`/cart` → `/checkout` (nhập thông tin nhận hàng) → `/checkout/[ref]` (mã QR + thông tin chuyển khoản)

### Cấu hình

```bash
cp .env.example .env.local
```

Điền ba khoá lấy từ [my.payos.vn](https://my.payos.vn) → **Kênh thanh toán → Thông tin xác thực API**:

| Biến                  | Ý nghĩa                                     |
| --------------------- | ------------------------------------------- |
| `PAYOS_CLIENT_ID`     | Client ID                                    |
| `PAYOS_API_KEY`       | API Key                                      |
| `PAYOS_CHECKSUM_KEY`  | Checksum Key — dùng để ký và xác thực chữ ký |
| `NEXT_PUBLIC_SITE_URL`| Địa chỉ trang web, dùng cho returnUrl/cancelUrl |

Nếu thiếu ba khoá PayOS, trang thanh toán chạy ở **chế độ xem thử**: mã QR được tạo tại chỗ từ
tài khoản ngân hàng trong `SHOP_BANK_*` và không có đối soát tự động.

### Webhook

```bash
npm run payos:webhook -- https://<tên-miền>
```

Script tự thử URL trước rồi mới gọi `/confirm-webhook` của PayOS, nên phân biệt được
"server chưa chạy", "tunnel đã chết" và "PayOS từ chối" — trên bảng điều khiển thì cả ba
đều chỉ hiện một dòng "không hợp lệ" giống hệt nhau. Khai báo tay cũng được:
**Kênh thanh toán → Webhook Url** → `https://<tên-miền>/api/payos/webhook`.

PayOS phải gọi được URL này từ internet, nên khi chạy localhost cần một tunnel:

```bash
cloudflared tunnel --url http://localhost:3000     # in ra một địa chỉ trycloudflare.com
npm run payos:webhook -- https://<địa-chỉ-vừa-in-ra>
```

**Bỏ qua webhook vẫn chạy được, nhưng không nên khi đã bán thật.** Trang thanh toán tự hỏi
PayOS mỗi 4 giây (`GET /api/orders/[ref]`), nên trên máy cá nhân đơn vẫn tự chuyển sang PAID.
Nhưng vòng lặp đó chỉ sống khi khách còn mở trang: quét QR xong đóng tab rồi mới chuyển tiền
là đơn kẹt ở `PENDING` dù tiền đã về. Webhook do PayOS chủ động gọi nên không phụ thuộc vào đó.

Route `POST /api/payos/webhook` xác thực chữ ký HMAC-SHA256 bằng `PAYOS_CHECKSUM_KEY` trước
khi ghi bất cứ thứ gì, và đối chiếu số tiền với đơn đã lưu — chuyển thiếu thì ghi `UNDERPAID`
chứ không bao giờ tính là đã thanh toán.

### Giá thử thanh toán

Chuyển khoản thật để thử luồng thanh toán mà không tốn tiền thật:

```bash
NEXT_PUBLIC_TEST_PRICE=1000     # trong .env
```

Mọi sản phẩm về 1.000 ₫, bỏ giá gạch ngang, và **miễn phí giao hàng** — thiếu vế cuối thì
đơn 1.000 ₫ vẫn bị cộng 30.000 ₫ tiền ship, tổng ra 31.000 ₫. Máy chủ in một cảnh báo lúc
khởi động khi biến này đang bật.

Xoá biến đi là bảng giá trở lại nguyên vẹn — giá gốc trong `lib/data.ts` không bị đụng tới.
Tiền tố `NEXT_PUBLIC_` là bắt buộc: giá hiển thị ở cả máy chủ lẫn trình duyệt, biến chỉ có ở
một phía sẽ làm hai bên vẽ hai con số khác nhau và hỏng hydrate.

### Lưu trữ đơn hàng

Đơn hàng được ghi ra `.data/orders.json` (xem `lib/orders.ts`). Đủ dùng cho một máy chủ ghi vào
một ổ đĩa. Khi triển khai serverless hoặc chạy nhiều tiến trình, cần thay bằng cơ sở dữ liệu —
chỉ phải viết lại năm hàm ở cuối `lib/orders.ts`.

## Nhập sản phẩm từ Shopee

Shopee chặn máy chủ gọi API danh sách sản phẩm (trả về `error 90309999`), nhưng trình duyệt
đã đăng nhập thì gọi bình thường. Vì vậy bước lấy dữ liệu làm thủ công một lần:

1. Mở link này trong tab đang đăng nhập Shopee (đổi `match_id` nếu dùng shop khác):

   ```
   https://shopee.vn/api/v4/search/search_items?by=pop&limit=100&match_id=1481009453&newest=0&order=desc&page_type=shop&scenario=PAGE_OTHERS&version=2
   ```

2. `Ctrl+S` lưu lại file JSON.

3. Chạy:

   ```bash
   npm run import:shopee -- ./duong-dan-file.json
   ```

Script tải toàn bộ ảnh về `public/images/shopee/` và sinh `lib/catalogue.generated.ts`.
Chừng nào file đó còn rỗng thì web dùng catalogue mẫu, nên không bao giờ trống trang.
Chạy lại nhiều lần được — ảnh đã tải thì bỏ qua.

Shop hiện tại: **By Roé Atelier** — shop ID `1481009453`.

### Hai thứ endpoint này không trả về

- **`description` và `details`** — mô tả sản phẩm. Script để trống thay vì bịa nội dung;
  điền tay trong file vừa sinh.
- **Tồn kho theo từng phân loại** — chỉ có tổng tồn kho của cả sản phẩm, nên script chia
  đều cho các phân loại. Chia ít hơn thực tế chứ không bao giờ hứa thừa.

Nếu shop có trên 100 sản phẩm, lưu thêm các trang bằng cách đổi `offset=100`, `offset=200`…
rồi chạy importer cho từng file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
