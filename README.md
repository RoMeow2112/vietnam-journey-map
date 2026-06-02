# Vietnam Journey Map

## Tổng quan

Dự án này là một web app khám phá du lịch Việt Nam được xây dựng bằng React, Supabase và Google Apps Script.

- Frontend: React + Vite + Tailwind CSS
- Auth & database: Supabase
- Dữ liệu thủ công: Google Apps Script (GG App Script) để nhập data vào Google Sheet và sync về database
- Map API: Goong Map cho các phần liên quan đến bản đồ

## Luồng dữ liệu

1. Admin hoặc người quản lý nhập dữ liệu thủ công vào Google Sheet thông qua Google Apps Script.
2. Google Apps Script đồng bộ dữ liệu từ Sheet lên database Supabase.
3. Frontend React gọi API từ `VITE_APPS_SCRIPT_URL` để lấy dữ liệu địa điểm, thông tin province, review, v.v.
4. Dữ liệu lưu trong Supabase được dùng cho auth, profile, review và trạng thái user.
5. Phần bản đồ sử dụng Goong Map để hiển thị các địa điểm, popup tooltip, vùng tỉnh và thao tác tương tác với map.

## Cấu trúc chính

- `src/App.tsx`: Cấu hình router, bao gồm route công khai và route admin.
- `src/lib/supabase.ts`: Khởi tạo Supabase client và adminSupabase client.
- `src/services/placeService.ts`: Các hàm gọi API Google Apps Script để lấy dữ liệu place và map.
- `src/pages/admin`: Các trang admin như quản lý users, reviews, dashboard dữ liệu.
- `src/components`: Các component chính cho phần user và map.
- `public/data/vietnam-provinces.geojson`: Dữ liệu GeoJSON tỉnh thành dùng cho bản đồ.

## Biến môi trường cần thiết

Tạo file `.env` hoặc `.env.local` ở thư mục gốc với các biến sau:

```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
```

- `VITE_SUPABASE_URL`: URL Supabase project
- `VITE_SUPABASE_ANON_KEY`: Khóa anon public của Supabase
- `VITE_APPS_SCRIPT_URL`: URL Google Apps Script để gọi API dữ liệu

## Cài đặt và chạy project

```bash
npm install
npm run dev
```

Hoặc với Bun nếu bạn dùng Bun:

```bash
bun install
bun run dev
```

## Chạy build

```bash
npm run build
```

## Lưu ý

- Project dùng React Router để điều hướng, admin dùng `AdminGuard` và `AdminLayout`.
- Dữ liệu map hiện tại được lấy từ API của Google Apps Script, còn Goong Map được dùng cho phần hiển thị bản đồ và popup.
- Supabase vừa dùng để lưu dữ liệu vừa dùng để xác thực user/admin.

## Tài liệu nhanh

- Trang user: `/`
- Trang login user: `/login`
- Trang admin login: `/admin/login`
- Trang admin dashboard: `/admin`
- Trang admin users: `/admin/users`
- Trang admin reviews: `/admin/reviews`
- Trang data dashboard: `/admin/data-dashboard`

