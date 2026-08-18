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

### Thư xác nhận đơn hàng

Khi đơn chuyển sang `PAID`, khách nhận một thư gồm: danh sách sản phẩm, tạm tính / phí giao
hàng / tổng cộng, thông tin người nhận và địa chỉ giao, mã giao dịch, lời cảm ơn và thông tin
liên hệ của shop.

Thư gửi thẳng qua SMTP của Gmail, nên **không cần tên miền riêng**:

```bash
SMTP_USER=thebasicconcept.official@gmail.com
SMTP_PASSWORD=<App Password 16 ký tự>
# SHOP_EMAIL_FROM=The Basic Concept <thebasicconcept.official@gmail.com>
# SHOP_EMAIL_BCC=chu-shop@gmail.com   # tuỳ chọn, để shop cũng nhận một bản
```

`SMTP_PASSWORD` **không phải** mật khẩu đăng nhập Gmail mà là *App Password*:
Tài khoản Google → Bảo mật → **Xác minh 2 bước** → **Mật khẩu ứng dụng**. Phải bật Xác minh
2 bước thì mục đó mới hiện ra.

Thử cấu hình mà không cần đặt hàng thật:

```bash
npm run email:test                    # gửi về chính SMTP_USER
npm run email:test -- ai-do@gmail.com
```

Script bắt tay với máy chủ trước rồi mới gửi, nên phân biệt được "sai App Password" và "gửi
được nhưng thư bị chặn" — gộp lại thì chỉ thấy một dòng "gửi thất bại" và không biết sửa đâu.

Chưa cấu hình thì thanh toán vẫn chạy bình thường, chỉ là không có thư.

**Gửi bù được.** Đơn đã thanh toán mà thiếu thư — vì lúc đó chưa cấu hình email, hoặc vì lần
gửi trước trượt — sẽ được thử lại ngay khi có ai mở `/checkout/[ref]` hoặc gọi
`GET /api/orders/[ref]`. `syncOrderStatus` cố ý kiểm tra việc này **trước** khi thoát sớm với
đơn đã chốt trạng thái; không có nhánh đó thì một lá thư gửi hỏng là mất vĩnh viễn, vì webhook
chỉ gọi đúng một lần.

Gmail cho khoảng **500 thư/ngày**; vượt mức đó, hoặc khi đã có tên miền riêng, thì chuyển sang
Resend/Brevo bằng cách viết lại mỗi hàm `deliver()` trong `lib/email.ts` — mẫu thư và luồng
gửi ở `lib/order-email.ts` không phải sửa.

**Gửi đúng một lần.** Cả webhook PayOS lẫn vòng poll của trang thanh toán đều có thể là bên
đầu tiên thấy đơn đã trả tiền. Quyền gửi được giành bằng `claimConfirmationEmail` — kiểm tra
và đánh dấu nằm gọn trong một transaction, nên hai bên chạy sát nhau vẫn chỉ ra một lá thư.
Gửi hỏng thì cờ được mở lại để lần xác nhận sau thử tiếp.

**Email là bắt buộc.** Shop không có tài khoản đăng nhập, nên thư này là thứ duy nhất khách
cầm được về đơn hàng. Quy tắc nằm ở `validateCustomer` trong `lib/checkout.ts` — dùng chung
cho cả form phía trình duyệt lẫn `POST /api/checkout`, nên không lách được bằng cách gọi
thẳng API.

### Lưu trữ đơn hàng

Đơn hàng được ghi ra `.data/orders.json` (xem `lib/orders.ts`). Đủ dùng cho một máy chủ ghi vào
một ổ đĩa. Khi triển khai serverless hoặc chạy nhiều tiến trình, cần thay bằng cơ sở dữ liệu —
chỉ phải viết lại năm hàm ở cuối `lib/orders.ts`.

## Lấy dữ liệu thật từ Shopee

Catalogue của web (`lib/catalogue.generated.ts`) được sinh ra từ shop Shopee, không viết tay.
Chừng nào file đó còn rỗng thì web dùng catalogue mẫu trong `lib/data.ts`, nên không bao giờ
trống trang. Có hai đường lấy dữ liệu, ưu tiên đường thứ nhất.

### 1. Open Platform — API chính thức (khuyên dùng)

Lấy được đủ thứ mà đường thứ hai không có: **danh mục thật**, **mô tả**, **tồn kho từng
phân loại** và **lượt bán** để xếp khối "Bán chạy nhất".

1. Đăng ký ứng dụng tại [open.shopee.com](https://open.shopee.com) → *App Management* → tạo app.
   Chép **Partner ID** và **Partner Key** vào `.env.local` (xem `.env.example`).
   Khai luôn một *Redirect URL* — dùng gì cũng được, script chỉ đọc `?code=` trên thanh địa chỉ.

2. Uỷ quyền shop, làm một lần:

   ```bash
   npm run shopee:auth
   ```

   Script in ra link; mở bằng tài khoản chủ shop, bấm đồng ý, rồi dán lại URL trình duyệt
   nhảy tới. Token ghi vào `.shopee/token.json` (đã nằm trong `.gitignore`).

3. Đồng bộ:

   ```bash
   npm run sync:shopee              # toàn bộ sản phẩm đang bán
   npm run sync:shopee -- --limit 20
   ```

Access token sống 4 tiếng và script tự làm mới bằng refresh token. Refresh token sống 30
ngày — bỏ không đồng bộ lâu hơn thế thì phải chạy lại `npm run shopee:auth`.

Giá và tồn kho là ảnh chụp tại thời điểm đồng bộ, không phải thời gian thực. Bán hàng đều
thì đặt lịch chạy `npm run sync:shopee` (cron / GitHub Action) rồi build lại — vài lần một
ngày là đủ, Shopee cho 1.000 lượt gọi mỗi phút.

Các endpoint đang dùng nằm ở `lib/shopee/products.ts`; phần ký chữ ký và token ở
`lib/shopee/client.ts`.

| Dữ liệu | Endpoint |
| --- | --- |
| Danh mục | `/api/v2/product/get_category` |
| Danh sách sản phẩm | `/api/v2/product/get_item_list` |
| Thông tin, giá, mô tả | `/api/v2/product/get_item_base_info` |
| Phân loại + tồn kho | `/api/v2/product/get_model_list` |
| Lượt bán, đánh giá | `/api/v2/product/get_item_extra_info` |

### 2. JSON lưu từ trình duyệt — đường dự phòng

Dùng khi chưa kịp đăng ký ứng dụng. Shopee chặn máy chủ gọi API danh sách sản phẩm (trả về
`error 90309999`), nhưng trình duyệt đã đăng nhập thì gọi bình thường:

1. Mở link này trong tab đang đăng nhập Shopee (đổi `match_id` nếu dùng shop khác):

   ```
   https://shopee.vn/api/v4/search/search_items?by=pop&limit=100&match_id=1481009453&newest=0&order=desc&page_type=shop&scenario=PAGE_OTHERS&version=2
   ```

2. `Ctrl+S` lưu lại file JSON.

3. Chạy:

   ```bash
   npm run import:shopee -- ./duong-dan-file.json
   ```

Endpoint này không trả về mô tả (để trống thay vì bịa nội dung) và cũng không có tồn kho
theo từng phân loại — chỉ có tổng tồn của cả sản phẩm, nên script chia đều cho các phân
loại. Chia ít hơn thực tế chứ không bao giờ hứa thừa.

Shop trên 100 sản phẩm thì lưu thêm các trang bằng cách đổi `offset=100`, `offset=200`…
rồi chạy importer với nhiều file một lượt.

Cả hai đường đều tải ảnh về `public/images/shopee/` và chạy lại nhiều lần được — ảnh đã có
thì bỏ qua.

Shop hiện tại: **By Roé Atelier** — shop ID `1481009453`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
