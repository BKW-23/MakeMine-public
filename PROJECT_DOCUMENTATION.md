# MakeMine Project Documentation

## 1. Tổng quan

MakeMine là cửa hàng quà tặng cá nhân hóa, tập trung vào móc khóa, gương, lược
và kẹp tóc có thể khắc tên, màu sắc, font chữ và lời chúc. Ứng dụng cung cấp
catalog sản phẩm, giỏ hàng, đặt hàng COD, theo dõi đơn, trang quản trị và trợ lý
AI gợi ý quà tặng.

Stack triển khai hiện tại:

- Frontend: React 18, Vite, React Router, Tailwind CSS.
- Database và authentication: Supabase.
- Server API: Vercel Functions trong thư mục [api](api).
- AI: Google Gemini `gemini-2.5-flash`, chỉ được gọi từ server.
- Hosting/deploy: Vercel kết nối với branch `main` trên GitHub.

## 2. Cấu trúc repository

### Root

- [README.md](README.md): setup, biến môi trường và lệnh kiểm tra.
- [package.json](package.json): scripts và dependencies.
- [index.html](index.html): HTML entry, title và favicon tab.
- [public](public): các asset tĩnh, gồm ảnh mẫu và icon thương hiệu.
- [vite.config.js](vite.config.js): cấu hình Vite.
- [eslint.config.js](eslint.config.js): cấu hình ESLint.

### Frontend

- [src/App.jsx](src/App.jsx): router và provider.
- [src/main.jsx](src/main.jsx): bootstrap ứng dụng.
- [src/index.css](src/index.css): theme, animation và utility styles.
- [src/api/base44Client.js](src/api/base44Client.js): lớp tương thích tên cũ,
  nhưng runtime bên trong gọi Supabase REST và các API nội bộ.
- [src/lib/AuthContext.jsx](src/lib/AuthContext.jsx): trạng thái đăng nhập.
- [src/lib/cart.jsx](src/lib/cart.jsx): giỏ hàng lưu trong localStorage.
- [src/lib/productImages.js](src/lib/productImages.js): dữ liệu ảnh, category
  và hàm định dạng giá.
- [src/pages](src/pages): Home, Catalog, ProductDetail, Cart, OrderTracking,
  Admin và các màn hình authentication.
- [src/components](src/components): layout, card sản phẩm, AI assistant và
  các component dùng chung.

### Backend API

- [api/_supabase.js](api/_supabase.js): helper gọi Supabase service role và
  kiểm tra bearer token.
- [api/me.js](api/me.js): trả về user hiện tại.
- [api/orders.js](api/orders.js): tạo đơn hàng.
- [api/orders-lookup.js](api/orders-lookup.js): tra cứu đơn hàng.
- [api/admin/products.js](api/admin/products.js): tạo và liệt kê sản phẩm admin.
- [api/admin/products/[id].js](api/admin/products/[id].js): xóa sản phẩm.
- [api/admin/orders.js](api/admin/orders.js): liệt kê đơn hàng admin.
- [api/admin/orders/[id].js](api/admin/orders/[id].js): cập nhật trạng thái đơn.
- [api/gift-suggestion.js](api/gift-suggestion.js): AI gợi ý sản phẩm.
- [api/generate-greeting.js](api/generate-greeting.js): AI tạo lời chúc.

### Database

- [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql): schema,
  trigger profile, RLS và grants ban đầu.
- [supabase/migrations/002_security_hardening.sql](supabase/migrations/002_security_hardening.sql):
  giới hạn quyền đọc dữ liệu khách hàng và validation đơn hàng.
- [supabase/seed.sql](supabase/seed.sql): bảy sản phẩm mẫu với ảnh local trong
  `public/`.

Các migration và seed này được viết để có thể chạy lại an toàn trong Supabase
Preview. `001_init.sql` dùng `if not exists`, tạo lại trigger/policy cần thiết
mà không xóa bảng hoặc dữ liệu. `seed.sql` dùng `slug` làm conflict key nên sẽ
cập nhật sản phẩm mẫu thay vì tạo bản ghi trùng.

## 3. Hiện trạng (đã làm) [x]

### 3.1 Mô hình dữ liệu hiện tại

#### `public.profiles`

- `id`: liên kết tới `auth.users.id`.
- `role`: `user` hoặc `admin`.
- `created_at`: thời điểm tạo profile.

Profile được tạo tự động bởi trigger `handle_new_user`.

#### `public.products`

- `name`, `slug`, `category`.
- `base_price`, `short_description`, `image_url`.
- `customizable`, `colors`, `fonts`.
- `featured`, `stock`, `created_at`.

Sản phẩm được đọc công khai. Hiện tại admin có thể tạo và xóa sản phẩm qua API
và policy trên server; chức năng sửa sản phẩm chưa có trong codebase hiện tại.

#### `public.orders`

- Thông tin khách: `customer_name`, `customer_phone`, `customer_email`, `address`.
- Giỏ hàng: `items` dạng JSON array.
- `total`, `status`, `preview_confirmed`, `user_id`, `created_at`.
- `status`: `pending`, `paid`, `shipped`, `delivered` hoặc `cancelled`.

Khách có thể tạo đơn. Dữ liệu đơn chỉ được đọc hoặc cập nhật qua server/admin
được xác thực.

#### `public.chat_suggestions`

Lưu input và kết quả trợ lý AI để phục vụ lịch sử/analytics server-side:

- `user_query`, `occasion`, `recipient`, `budget`.
- `suggested_product_ids`, `suggestions`, `created_at`.

Client không được đọc trực tiếp bảng này.

### 3.2 Tính năng và API hiện có [x]

- Frontend React/Vite đang có catalog, cart, order tracking, auth và admin UI.
- Backend API hiện có: [api/me.js](api/me.js), [api/orders.js](api/orders.js),
  [api/orders-lookup.js](api/orders-lookup.js), [api/gift-suggestion.js](api/gift-suggestion.js),
  [api/generate-greeting.js](api/generate-greeting.js), và các endpoint admin trong
  [api/admin](api/admin).
- Server-side helper trong [api/_supabase.js](api/_supabase.js) quản lý Supabase
  client, xác thực token và các helper bảo mật chung. Rate limit hiện đang dựa
  trên cơ chế bộ nhớ trong file; trên Vercel Functions, mỗi instance có bộ nhớ
  riêng và cold start có thể reset state, nên đây là giải pháp thử nghiệm,
  không phải cách tối ưu cho production scale.
- Mã đơn hàng hiện được tạo ngẫu nhiên thay vì đếm tuần tự.
- Endpoint đặt hàng và AI đã có một lớp validation, kiểm tra quyền và giới hạn
  request cơ bản.

### 3.3 Ràng buộc hiện có đã thực hiện trong code [x]

- `total` được server tính lại từ `base_price` và số lượng thực tế, thay vì tin
  dữ liệu từ browser.
- `stock` được kiểm tra trên server khi tạo đơn.
- Rate limiting hiện có ở các endpoint public quan trọng, nhưng cơ chế hiện tại
  cần được chuyển sang service có bộ nhớ phân tán cho production scale.
- Input từ client được validate ở server trước khi ghi DB.
- Gemini key chỉ được giữ ở server environment, không có trong bundle browser.

> Lưu ý: đây là trạng thái hiện tại của codebase, không phải là cam kết rằng hệ
> thống đã đạt chuẩn thương mại đầy đủ. Dưới phần Backlog, những item chưa phục
> vụ môi trường bán thật sẽ được ghi rõ với trạng thái `[ ]`.

## 4. Backlog trước khi bán thật [ ]

### 4.1 Bảo mật và tính đúng đắn bắt buộc [ ]

Các mục sau là ràng buộc kỹ thuật cần hoàn tất trước khi mở rộng ra traffic thật
hoặc chuyển sang môi trường sản xuất thương mại:

- [ ] Tính giá đơn hàng phải dựa trên quy tắc ưu tiên server-side, có nguồn dữ
      liệu giá duy nhất từ `public.products` hoặc bảng giá nội bộ.
- [ ] Trừ tồn kho cần làm theo transaction/atomic. Với Supabase, cách khuyến
      nghị là dùng một function PostgreSQL/RPC để tạo đơn và cập nhật stock
      trong cùng một transaction để tránh race condition khi nhiều request cùng
      lúc đặt hàng.
- [ ] Rate limit cần được triển khai bằng công cụ đã chọn rõ ràng, ví dụ Vercel
      WAF hoặc Upstash Redis; không nên để rate-limit chỉ là “logic tùy từng file”
      mà không có kế hoạch scaling và ops rõ ràng.
- [ ] Mã đơn hàng nên dùng UUID v4 hoặc random string đủ dài; không dùng ID tuần tự.
- [ ] Dữ liệu cá nhân trong `public.orders` phải có chính sách lưu trữ, thời hạn
      lưu, quyền xem/xóa dữ liệu và cách xử lý khi bắt buộc xóa theo hợp đồng.
- [ ] Tất cả input từ client đều phải validate bằng schema rõ ràng (ví dụ Zod,
      validator server-side) và ràng buộc đúng kiểu dữ liệu, range, độ dài,
      trạng thái sản phẩm, và giá trị hợp lệ.
- [ ] Mỗi endpoint public cần có logging, khoảng thời gian retry/quota rõ ràng,
      và phản hồi lỗi không lộ thông tin nhạy cảm cho client.
- [ ] Không để các check “có thể chạy local” bị hiểu lầm là “đã đúng cho production”.
      Checklist dưới đây là preflight cho launch thương mại, không phải mô tả tình
      trạng hiện tại của lần deploy demo/public đang chạy.

### 4.2 Luồng nghiệp vụ và schema cần bổ sung [ ]

- [ ] Bổ sung migration `003` cho schema chưa có trong DB hiện tại như:
      `shipping_fee`, `discount`, `customization_fee`, `payment_status`,
      `order_notes`, `status_history`.
- [ ] Xác định rõ quy trình phụ phí khắc tên: tính ở đâu, lưu ở đâu, cách admin
      chỉnh sửa, và cách hiển thị trong checkout.
- [ ] Xây dựng workflow xác nhận đơn qua email/SMS và trạng thái `pending`,
      `paid`, `shipped`, `delivered`, `cancelled` rõ ràng.
- [ ] Admin cần có giao diện sửa sản phẩm và xem chi tiết tùy chỉnh của đơn nếu
      feature đó được triển khai. Hiện tại UI và API hiện có chỉ hỗ trợ tạo/xóa sản
      phẩm và trạng thái đơn; không có sửa sản phẩm trong codebase hiện tại.
- [ ] Xác định rõ logic `payment_status`: COD, thanh toán trước, hoặc xử lý sau
      khi nhận chuyển khoản.
- [ ] Thiết lập workflow upload/transform ảnh qua Supabase Storage hoặc CDN.
- [ ] Định nghĩa rõ policy đổi trả và hủy đơn trước khi bán thật.

### 4.3 Vận hành, triển khai và backup [ ]

- [ ] Supabase/RLS phải được kiểm thử trên môi trường thật bởi người chịu trách
      nhiệm, không chỉ qua local SQL.
- [ ] Supabase free có thể tự tạm dừng sau khoảng một tuần không hoạt động; cần
      có kế hoạch đánh thức hoặc ping định kỳ và monitoring downtime.
- [ ] Vercel Hobby phù hợp cho dự án thử nghiệm, nhưng cần xem lại gói hosting khi
      bắt đầu bán thật.
- [ ] Chọn giải pháp rate limit và monitoring rõ ràng: Vercel WAF, Upstash Redis,
      Sentry, Logtail, Vercel logs hoặc tương đương.
- [ ] Thiết lập pipeline CI/CD với `npm run lint`, `npm run build` và test tự động
      trước khi merge vào `main`.
- [ ] Thiết lập backup database, dữ liệu upload, catalog và quy trình restore.
- [ ] Phân biệt rõ `development`, `staging`, `production` và không dùng shared
      environment cho tất cả môi trường.
- [ ] Chuyển migration từ SQL Editor sang workflow versioned bằng Supabase CLI/
      migration pipeline.
- [ ] Có ngưỡng nhận việc rõ ràng: ai kiểm tra RLS, ai verify production env,
      ai review billing/stock logic, ai sign-off trước khi mở bán.

### 4.4 AI, data privacy và consent [ ]

- [ ] Kiểm tra điều khoản hiện tại của Google Gemini theo gói đang dùng. Các
      gói miễn phí hoặc một số gói có lưu trữ dữ liệu cho mục đích cải thiện mô
      hình có thể khác với gói trả phí. Vì vậy, không nên tuyên bố “không dùng
      dữ liệu khách hàng cho training AI” nếu chưa xác nhận điều khoản hợp đồng
      và chính sách lưu trữ hiện hành.
- [ ] Theo nguyên tắc tối thiểu hóa dữ liệu, không gửi tên người nhận, địa chỉ,
      số điện thoại, hoặc thông tin định danh cá nhân vào prompt AI nếu không cần
      thiết cho task đó.
- [ ] Nếu dữ liệu AI được lưu để debug hoặc đánh giá chất lượng, cần quy định rõ
      thời gian lưu, mục đích, quyền truy cập và cơ chế xóa. Điều này đặc biệt
      quan trọng với `chat_suggestions`, vì bảng này lưu `user_query` dạng văn bản
      tự do và có thể chứa thông tin cá nhân.
- [ ] Khi Gemini trả lỗi hoặc hết quota, UI phải hiện thông báo rõ ràng và không
      làm màn hình treo hoặc rỗng.

## 5. Luồng runtime

### 5.1 Đọc sản phẩm

Frontend gọi `Product.list()` trong [src/api/base44Client.js](src/api/base44Client.js).
Khi đủ biến môi trường, request đi tới Supabase REST:

```text
/rest/v1/products?select=*&order=created_at.desc&limit=60
```

Khi chạy local chưa có biến Supabase, client dùng một sản phẩm mẫu local để
giao diện vẫn có thể xem và phát triển. Fallback này chỉ dành cho local thiếu
cấu hình; môi trường production phải cấu hình Supabase đầy đủ.

### 5.2 Authentication

Authentication dùng Supabase Auth REST API:

- Login bằng email/password.
- Đăng ký tài khoản.
- Xác minh OTP.
- Gửi email reset password.
- Cập nhật password.
- OAuth provider qua Supabase authorize endpoint.

Session được lưu trong localStorage với key `makemine_supabase_session`.
Các API server nhận bearer token và xác thực lại token với Supabase trước khi
cho phép thao tác cần đăng nhập.

### 5.3 Đặt hàng

1. Người dùng chọn sản phẩm và tùy chỉnh tên/màu/font/lời chúc.
2. Item được lưu trong cart localStorage.
3. Người dùng nhập thông tin giao hàng và xác nhận preview.
4. Frontend gọi `POST /api/orders`.
5. Server thực hiện validation chặt chẽ, kiểm tra tồn kho, xác thực thông tin
   khách hàng và tính lại `total` từ dữ liệu sản phẩm trên server.
6. Server không tin vào `total`, `base_price`, hay `quantity` do client gửi lên
   mà phải tính lại dựa trên sản phẩm trong database.
7. Sau khi xác nhận, server ghi đơn hàng vào `public.orders` và trả về mã đơn
   duy nhất.
8. UI hiển thị mã đơn hàng sau khi tạo thành công.

Các ràng buộc bắt buộc khi tạo đơn nên có, nhưng hiện trạng code chưa thực
hiện đầy đủ atomic stock transaction theo mô hình production. Cần ưu tiên triển
khai function RPC/transaction trên Supabase trước khi coi đây là hoàn tất:

- `total` nên được tính lại từ `base_price` và số lượng thực tế.
- `stock` phải đủ cho từng item trong transaction, không chỉ kiểm tra ở tầng
  request.
- `items` phải hợp lệ, không có sản phẩm không tồn tại hoặc giá thay đổi ngoài server.
- `preview_confirmed` phải hợp logic nghiệp vụ.
- Không cho phép đơn hàng gộp product giả mạo hoặc giá bị thao túng.

### 5.4 Theo dõi đơn

Trang `/don-hang` gọi endpoint tra cứu với mã đơn và số điện thoại.
Server chỉ trả dữ liệu phù hợp với thông tin tra cứu, không mở quyền đọc toàn
bộ bảng orders cho client.

Endpoint tra cứu nên có:

- rate limit theo IP/user.
- giới hạn số request trong một khoảng thời gian.
- log và chặn truy cập bất thường.
- mã đơn hàng dạng UUID hoặc chuỗi ngẫu nhiên.

### 5.5 Quản trị

Trang `/admin` yêu cầu user có `profiles.role = 'admin'`.

Admin hiện có thể:

- Xem và cập nhật trạng thái đơn hàng.
- Tạo sản phẩm.
- Xóa sản phẩm.
- Xem số liệu sản phẩm/đơn hàng trong giao diện quản trị.

UI hiện tại không có màn hình sửa sản phẩm và cũng chưa có khung hiển thị chi
tiết tùy chỉnh của item rõ ràng trong admin. Nếu tính năng này được triển khai,
chúng ta cần hiển thị tên khắc, font, màu, lời chúc, số lượng và metadata sản
phẩm đã đặt.

Việc kiểm tra role được thực hiện lại ở server, không chỉ dựa vào route guard
frontend.

### 5.6 AI gợi ý quà tặng

`POST /api/gift-suggestion`:

1. Nhận dịp tặng, người nhận và ngân sách.
2. Đọc danh sách sản phẩm từ Supabase bằng service role.
3. Gọi Gemini `gemini-2.5-flash`.
4. Lọc các `product_id` không tồn tại.
5. Trả về tối đa 5 gợi ý và lý do.
6. Lưu log vào `chat_suggestions`.

Gemini API key chỉ nằm ở server environment, không được đưa vào bundle browser.

### 5.7 AI tạo lời chúc

`POST /api/generate-greeting` nhận recipient, relationship, occasion, hobbies,
keywords và productName. Server gọi Gemini, parse JSON, làm sạch kết quả và
trả về tối đa 3 lời chúc tiếng Việt ngắn, không emoji.

## 6. UI/UX

- Header sticky có navigation, logo MakeMine và giỏ hàng.
- Logo badge dùng asset local [public/favicon.png](public/favicon.png).
- Favicon tab dùng asset tròn [public/tab-icon.png](public/tab-icon.png).
- Home có hero, category links, sản phẩm nổi bật và CTA mở AI assistant.
- Catalog hỗ trợ lọc category và sắp xếp theo giá.
- Product detail hỗ trợ preview tùy chỉnh và tạo lời chúc.
- Cart hiển thị item, số lượng, giá và form đặt hàng.
- Admin có giao diện quản lý sản phẩm/đơn.
- Ảnh dùng component độc lập trong [src/components/ui/image.jsx](src/components/ui/image.jsx);
  ảnh rỗng hoặc lỗi hiển thị fallback nội bộ, không gọi dịch vụ resize bên ngoài.

## 7. Setup local

### Cài dependencies

```bash
npm install
```

### Biến môi trường

Tạo `.env.local` ở root:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Không commit `.env.local`.

### Chuẩn bị database

Trong Supabase SQL Editor, với database mới chạy theo thứ tự:

1. [001_init.sql](supabase/migrations/001_init.sql)
2. [002_security_hardening.sql](supabase/migrations/002_security_hardening.sql)
3. [seed.sql](supabase/seed.sql)

Các file có thể được chạy lại khi cần; không xóa bảng để xử lý lỗi
`relation "profiles" already exists`.

### Chạy frontend và API local

```bash
npm run dev
```

Cách này chỉ chạy frontend Vite local. Để chạy toàn bộ app với các endpoint
server trong `/api`, cần dùng:

```bash
npx vercel dev
```

Đối với môi trường local đầy đủ, cần có biến môi trường server như:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

Để truy cập từ máy khác trong mạng local:

```bash
npm run dev -- --host 0.0.0.0
```

### Kiểm tra

```bash
npm run build
npm run lint
```

## 8. Cấu hình Vercel

Trong Vercel Project Settings, khai báo các biến sau cho Production:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

Sau khi thay đổi environment variables, cần redeploy để build frontend và
server functions nhận giá trị mới.

Không dùng tiền tố `VITE_` cho service role key hoặc Gemini key. Các key đó
chỉ được dùng trong [api](api).

## 9. Cấu hình Supabase Auth

Trong Supabase Authentication, cấu hình Site URL và Redirect URLs cho:

```text
http://localhost:5173
http://127.0.0.1:5173
https://makemine-bkw-23.vercel.app
```

Nếu bật Google OAuth, cấu hình provider trong Supabase và thêm callback URL
theo URL Supabase yêu cầu.

## 10. Tạo admin

1. Đăng ký tài khoản từ giao diện.
2. Chạy SQL sau trong Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'EMAIL_CUA_BAN'
);
```

3. Đăng xuất và đăng nhập lại để client nhận session mới.

## 11. Deploy và kiểm thử sau deploy

Push code lên branch `main`. Nếu Vercel đã kết nối GitHub repository, deploy sẽ
được kích hoạt tự động. Nếu không, chọn **Redeploy** trong Vercel.

Checklist cho launch thương mại (đặt trong bối cảnh preflight, không phải mô tả
trạng thái hiện tại của demo/public đang chạy):

- [ ] Trang chủ và catalog hiển thị sản phẩm.
- [ ] Ảnh sản phẩm tải được.
- [ ] Đăng ký, OTP, login và logout.
- [ ] Reset password.
- [ ] Thêm vào giỏ và tạo đơn.
- [ ] Tra cứu đơn.
- [ ] Tài khoản admin truy cập `/admin`.
- [ ] Admin tạo/xóa sản phẩm và cập nhật trạng thái đơn.
- [ ] Admin xem chi tiết tùy chỉnh sản phẩm và trạng thái vận hành nếu feature
      đó được triển khai.
- [ ] AI gift suggestion.
- [ ] AI greeting generation.
- [ ] Môi trường production chạy với biến môi trường đúng và không có secret lộ trong bundle.

## 12. Dữ liệu test local

- [gift.json](gift.json): payload test cho `/api/gift-suggestion`.
- [order.json](order.json): payload test cho `/api/orders`.

Đây là file test thủ công, không cần cho runtime production và không bắt buộc
push lên repository.

## 13. Hướng phát triển

- Thêm thanh toán online thay cho COD.
- Tối ưu workflow upload ảnh qua Supabase Storage và xử lý transform / fallback khi
  ảnh lỗi.
- Tách API client khỏi tên tương thích cũ để code dễ hiểu hơn.
- Bổ sung test tự động cho API validation và flow authentication.
- Cân nhắc thêm audit log cho thao tác admin nếu quyền quản trị mở rộng.

## 14. Yêu cầu pháp lý và bảo vệ dữ liệu

- Bán hàng thật tại Việt Nam nên xác minh lại các quy định hiện hành về bảo vệ
  dữ liệu cá nhân (ví dụ Nghị định 13/2023) và quy trình đăng ký website thương
  mại điện tử với Bộ Công Thương trước khi mở bán chính thức.
- Tài liệu pháp lý cần được xác nhận dựa trên nguồn chính thức và không coi đây
  là lời khuyên pháp lý cuối cùng.
