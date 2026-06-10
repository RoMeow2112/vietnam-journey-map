# Vietnam Journey Map 🗺️

Một web application khám phá du lịch Việt Nam hiện đại, cho phép người dùng xem bản đồ interactive của các tỉnh thành, tìm kiếm địa điểm du lịch, viết đánh giá, và theo dõi hành trình khám phá của mình.

---

## 📌 Tổng quan

Dự án này cung cấp:

- **Bản đồ tương tác** với Goong Maps - xem các tỉnh thành Việt Nam, highlight những nơi đã ghé thăm
- **Tìm kiếm thông minh** - tìm địa điểm, ẩm thực, đặc điểm theo tên hoặc từ khóa (tìm kiếm accent-sensitive)
- **Hệ thống đánh giá** - người dùng có thể viết review, đánh giá sao, upload ảnh/video
- **Theo dõi hành trình** - ghi lại số tỉnh thành đã ghé thăm với progress bar
- **Quản trị viên** - dashboard quản lý users, reviews, dữ liệu địa điểm
- **OAuth/Email Authentication** - đăng nhập với Google hoặc email

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 5** - Build tool & dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router v6** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Services
- **Supabase** - PostgreSQL database, Authentication (OAuth + Email), File Storage
- **Goong Maps** - Map visualization (Vietnam-optimized)
- **MapLibre GL** - Map rendering engine
- **Google Apps Script** - Data sync from Google Sheets

### UI & Components
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library (463+ icons)
- **Recharts** - Data visualization for analytics

### Additional Libraries
- **framer-motion** - Animations
- **sonner** - Toast notifications
- **date-fns** - Date utilities
- **@tanstack/react-query** - Server state management (optional)
- **class-variance-authority** - Component style variants

### Development
- **ESLint** - Code linting
- **Vitest** - Unit testing
- **TypeScript ESLint** - TS linting
- **@vitejs/plugin-react-swc** - Fast React refresh with SWC compiler

---

## 📁 Project Structure

```
vietnam-journey-map/
├── public/
│   └── data/
│       └── vietnam-provinces.geojson        # GeoJSON for map regions
├── src/
│   ├── App.tsx                              # Main router & layout
│   ├── main.tsx                             # React entry point
│   ├── index.css                            # Global styles
│   │
│   ├── components/                          # Reusable components
│   │   ├── GoongMap.tsx                     # Interactive Goong map
│   │   ├── VietnamMap.tsx                   # Vietnam map with regions
│   │   ├── Navbar.tsx                       # Search bar & navigation
│   │   ├── PlaceModal.tsx                   # Place detail modal
│   │   ├── PlaceReviews.tsx                 # Reviews section
│   │   ├── ProvinceModal.tsx                # Province info modal
│   │   ├── LoginRequiredModal.tsx           # Login prompt
│   │   └── ui/                              # shadcn/ui components
│   │
│   ├── pages/                               # Page components
│   │   ├── Index.tsx                        # Home with map
│   │   ├── UserLogin.tsx                    # User login/signup
│   │   ├── UserProfile.tsx                  # User profile & settings
│   │   ├── AuthCallback.tsx                 # OAuth callback handler
│   │   ├── NotFound.tsx                     # 404 page
│   │   └── admin/                           # Admin pages
│   │       ├── AdminLogin.tsx               # Admin login
│   │       ├── AdminHome.tsx                # Admin dashboard
│   │       ├── AdminUsers.tsx               # User management
│   │       ├── AdminReviews.tsx             # Review moderation
│   │       └── DataDashboard.tsx            # Analytics
│   │
│   ├── services/                            # API services
│   │   ├── placeService.ts                  # Place data from Google Apps Script
│   │   ├── reviewService.ts                 # Review management
│   │   └── visitedProvinceService.ts       # Visited tracking
│   │
│   ├── lib/
│   │   ├── supabase.ts                      # Supabase client setup
│   │   └── utils.ts                         # Utility functions
│   │
│   ├── constants/
│   │   └── mapData.ts                       # Mock data & constants
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx                   # Mobile detection
│   │   └── use-toast.ts                     # Toast notifications
│   │
│   ├── layouts/
│   │   └── AdminLayout.tsx                  # Admin page layout
│   │
│   ├── routes/
│   │   └── AdminGuard.tsx                   # Admin authorization
│   │
│   └── test/
│       ├── example.test.ts                  # Example tests
│       └── setup.ts                         # Test setup
│
├── supabase/
│   └── functions/
│       └── change-user-password/
│           ├── index.ts                     # Edge Function: password reset
│           └── deno.json                    # Deno config
│
├── .vscode/
│   ├── settings.json                        # VS Code settings
│   └── extensions.json                      # Recommended extensions
│
├── vite.config.ts                           # Vite config
├── tsconfig.json                            # TypeScript config
├── tailwind.config.ts                       # Tailwind config
├── eslint.config.js                         # ESLint config
├── package.json                             # Dependencies
├── bun.lockb                                # Bun lock file
└── README.md                                # This file
```

---

## ✨ Features

### 👥 User Features
✅ **Interactive Map**
- Xem bản đồ các tỉnh thành Việt Nam với MapLibre GL
- Hover/click vào tỉnh để xem danh sách địa điểm
- Highlight các tỉnh đã ghé thăm (với màu sắc đẹp)
- Zoom/pan controls, user location display

✅ **Smart Search**
- Tìm kiếm theo tên địa điểm chính xác
- Tìm kiếm theo tỉnh thành
- Tìm kiếm multi-word theo từ khóa
- **Accent-sensitive**: Search "biển" ≠ "biến/biên/biền" (avoid substring matching)
- Real-time results với max 8 kết quả

✅ **Place Details**
- Thông tin chi tiết: tên, tỉnh, khu vực, tọa độ
- Hình ảnh cover và mô tả ngắn
- Danh sách hấp dẫn (attractions) với ảnh & mô tả
- Danh sách ẩm thực/đặc sản
- Bình luận & đánh giá từ cộng đồng
- Thêm vào hành trình (favorite)

✅ **Reviews & Ratings**
- Viết bình luận chi tiết
- Đánh giá sao (1-5 stars)
- Upload ảnh (JPG/PNG/WEBP)
- Upload video (<10s, MP4/WEBM/MOV)
- Tối đa 3 file/review
- Xóa đánh giá của mình

✅ **User Profile**
- Xem/chỉnh sửa thông tin cá nhân
- Upload & thay đổi avatar
- Đổi mật khẩu

✅ **Journey Tracking**
- Theo dõi số tỉnh thành đã ghé thăm (XX/63)
- Progress bar % hành trình
- Persist visited provinces qua Supabase

### 👨‍💼 Admin Features
✅ **Admin Authentication**
- Đăng nhập riêng biệt (không ảnh hưởng user session)
- Separate storage key (`admin-auth-session` vs `user-auth-session`)
- Role-based access control

✅ **User Management** (`/admin/users`)
- Xem danh sách tất cả users
- Tạo user mới (email + password/role)
- Chỉnh sửa thông tin user
- Kích hoạt/vô hiệu hóa tài khoản
- **Đổi mật khẩu cho user** - via Supabase Edge Function
- Gán quyền admin/user

✅ **Review Moderation** (`/admin/reviews`)
- Xem tất cả đánh giá
- Xóa bình luận/review không phù hợp
- Tìm kiếm theo nội dung, user name, place name
- Quản lý media files

✅ **Analytics Dashboard** (`/admin/data-dashboard`)
- Tổng số users
- Users hoạt động / không hoạt động / pending
- Tổng số địa điểm
- Tổng số đánh giá
- Chart visualizations

✅ **Admin Home** (`/admin`)
- Dashboard overview
- Quick links to sections

---

## 🔧 Environment Variables

Tạo file `.env.local` ở thư mục gốc:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Google Apps Script API (for place data)
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
```

### Biến chi tiết

| Biến | Yêu cầu | Mô tả | Ví dụ |
|------|---------|-------|-------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase public key | `eyJhbGc...` (long string) |
| `VITE_APPS_SCRIPT_URL` | ✅ | Google Apps Script endpoint | `https://script.google.com/macros/s/AKfycby...` |

---

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/vietnam-journey-map.git
cd vietnam-journey-map
```

### 2. Install Dependencies
```bash
npm install
# Hoặc với Bun (faster)
bun install
```

### 3. Setup Environment
```bash
# Tạo .env.local
cp .env.example .env.local

# Edit .env.local với các giá trị thực của bạn
# Lấy từ Supabase dashboard & Google Apps Script URL
```

### 4. Development Server
```bash
npm run dev
# hoặc: bun run dev
```

Server chạy tại: **http://localhost:5173**

### 5. Build for Production
```bash
npm run build
# Output: dist/
```

---

## 🚀 Available Scripts

```bash
npm run dev              # Start dev server (Vite)
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run test             # Run tests once (Vitest)
npm run test:watch       # Watch mode for tests
```

---

## 📱 Responsive Design

✅ Fully responsive trên tất cả devices:
- Mobile-first approach
- Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly UI elements
- Adaptive layouts & images

---

## 🔐 Authentication & Authorization

### User Authentication Flow
```
User Click Login
    ↓
OAuth (Google) or Email/Password
    ↓
Supabase Auth
    ↓
Create Profile if new
    ↓
Redirect to /profile or /
```

**Key Files:**
- `src/pages/UserLogin.tsx` - Login/Signup UI
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/lib/supabase.ts` - Supabase client config

### Admin Authentication
```
Admin Click "Admin Login"
    ↓
Email/Password only (no OAuth)
    ↓
adminSupabase Auth (separate session)
    ↓
Check role == 'admin' && is_active == true
    ↓
Grant access to /admin routes
```

**Important:** Admin session là riêng biệt để tránh ảnh hưởng từ user OAuth.

---

## 🗄️ Database Schema

### profiles (User Profiles)
```sql
id               UUID PRIMARY KEY
email            TEXT UNIQUE
role             TEXT ('admin' | 'user')
is_active        BOOLEAN DEFAULT true
display_name     TEXT NULLABLE
avatar_url       TEXT NULLABLE
created_at       TIMESTAMP DEFAULT now()
updated_at       TIMESTAMP
```

### places (Locations)
```sql
id               TEXT PRIMARY KEY
name             TEXT
province         TEXT
region           TEXT ('North' | 'Central' | 'South')
lat              DECIMAL(10, 6)
lng              DECIMAL(10, 6)
cover_image      TEXT NULLABLE
short_description TEXT NULLABLE
attractions_json JSONB (PlaceContentItem[])
foods_json       JSONB (PlaceContentItem[])
is_active        BOOLEAN DEFAULT true
map_key          TEXT
created_at       TIMESTAMP
```

### place_reviews (User Reviews)
```sql
id               UUID PRIMARY KEY
place_id         TEXT FOREIGN KEY → places.id
user_id          UUID FOREIGN KEY → profiles.id
rating           INTEGER (1-5)
content          TEXT NULLABLE
media_urls       JSONB (ReviewMediaItem[])
created_at       TIMESTAMP
updated_at       TIMESTAMP NULLABLE
deleted_at       TIMESTAMP NULLABLE
deleted_by       UUID NULLABLE
```

### user_visited_provinces (Journey Tracking)
```sql
id               UUID PRIMARY KEY
user_id          UUID FOREIGN KEY → profiles.id
province         TEXT
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────┐
│  Google Sheets      │
│  (Manual Entry)     │
└──────────┬──────────┘
           │
           │ Auto-sync
           ↓
┌─────────────────────┐
│ Google Apps Script  │
│ (Sync Script)       │
└──────────┬──────────┘
           │ Push Data
           ↓
┌─────────────────────────────────┐
│ Supabase PostgreSQL Database    │
│ ├─ places                       │
│ ├─ profiles                     │
│ ├─ place_reviews                │
│ └─ user_visited_provinces       │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ↓             ↓
┌─────────┐  ┌──────────────┐
│ React   │  │ Supabase RLS │
│ Frontend│  │ (Security)   │
└─────────┘  └──────────────┘
```

### Services Layer

**placeService.ts**
- `getPlacesByRegion(region)` → Fetch places per region
- `getPlaceDetail(id)` → Get single place details
- Data from Google Apps Script API
- Normalize data to unified `PlaceDetail` format

**reviewService.ts**
- `getPlaceReviews(placeId)` → Fetch reviews
- `upsertPlaceReview(payload)` → Create/update review
- `deleteReview(id)` → Soft delete (set deleted_at)
- `uploadReviewMedia(files)` → Upload to Supabase Storage

**visitedProvinceService.ts**
- `addVisitedProvince(userId, province)` → Mark as visited
- `getVisitedProvinces(userId)` → Get list of visited
- `removeVisitedProvince(userId, province)` → Remove

---

## 🗺️ Map Features

### Goong Maps
- Vietnam-optimized map provider
- Better coverage for Vietnamese place names
- API: `@goongmaps/goong-js`

### MapLibre GL
- Open-source map rendering
- Goong compatible
- Custom styling support
- GeoJSON layer support

### Map Interactions
- **Hover regions** → Highlight visited provinces
- **Click region** → Show places in that region
- **Click marker** → Show place details
- **Zoom/Pan** → Navigate the map
- **User Location** → With permission
- **Search integration** → Click search result to zoom

---

## 📝 Search Algorithm

### Word-based (Accent-Insensitive)
Default for queries without Vietnamese diacritics:
```typescript
// "bien" matches: biến, biên, biền, bien (all normalized to "bien")
// But NOT partial strings like "Biểu" in "Biểu tượng"
```

### Diacritic-Sensitive
When query contains Vietnamese marks:
```typescript
// "biển" matches ONLY "biển" (not "biến")
// Uses NFC normalization, exact word matching
```

**Implementation:** [src/components/Navbar.tsx](src/components/Navbar.tsx#L38-L60)

---

## 🔌 API Integration Points

### Google Apps Script
Endpoint: `${VITE_APPS_SCRIPT_URL}`

**Requests:**
```typescript
// Get all places
fetch(`${API_URL}?action=places`)

// Get single place
fetch(`${API_URL}?action=place&id=da-lat`)

// Get regions
fetch(`${API_URL}?action=regions`)
```

**Response Format:**
```json
{
  "success": true,
  "places": [
    {
      "id": "da-lat",
      "name": "Đà Lạt",
      "province": "Lâm Đồng",
      "region": "South",
      "lat": 11.94,
      "lng": 108.44,
      "coverImage": "https://...",
      "shortDescription": "...",
      "attractions": [
        {
          "name": "Hồ Xuân Hương",
          "image": "https://...",
          "description": "..."
        }
      ],
      "foods": [...]
    }
  ]
}
```

### Supabase Realtime (Optional)
- Real-time review updates (if needed)
- Presence (active users)
- Setup in Supabase dashboard

---

## ♿ Accessibility

✅ Built with accessibility in mind:
- Semantic HTML elements
- ARIA labels on interactive components
- Keyboard navigation support
- Color contrast ratios (WCAG AA)
- Form labels & error messages
- Alt text for images

---

## 🧪 Testing

```bash
npm run test         # Run tests once
npm run test:watch   # Watch mode
```

**Test Framework:** Vitest
**Test Location:** `src/test/`

Example test: `src/test/example.test.ts`

---

## 🐛 Troubleshooting

### Search returns wrong results
**Solution:**
- Verify Google Apps Script API URL
- Check GeoJSON data structure
- Review console for API errors
- Test with exact place names first

### Map not loading
**Solution:**
- Check Goong API credentials
- Verify GeoJSON file exists at `public/data/vietnam-provinces.geojson`
- Open DevTools Network tab → check for 404s

### Login fails
**Solution:**
- Verify `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
- Check CORS settings in Supabase
- Review Supabase Auth logs
- Clear browser storage & try again

### Reviews not showing
**Solution:**
- Verify database has `place_reviews` table
- Check user has proper permissions
- Review Supabase RLS policies
- Check for soft-deleted reviews

### Upload file errors
**Solution:**
- Verify file size < 20MB
- Check video duration < 10 seconds
- Ensure valid format (JPG/PNG/WEBP/MP4/WEBM/MOV)
- Check Supabase Storage bucket permissions

---

## 📚 Key Dependencies

### Core UI/Framework
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3 | UI library |
| react-dom | ^18.3 | React rendering |
| react-router-dom | ^6.30 | Client routing |

### Styling & UI
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^3.4 | CSS framework |
| lucide-react | ^0.462 | Icons |
| shadcn/ui | - | Components |
| framer-motion | ^12.38 | Animations |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.61 | Form state |
| zod | ^3.25 | Validation |
| @hookform/resolvers | ^3.10 | Form validation |

### Backend & Data
| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.78 | Backend |
| @goongmaps/goong-js | ^1.0.9 | Maps |
| maplibre-gl | ^5.24 | Map rendering |

---

## 🚀 Deployment

### Build
```bash
npm run build
# Output: dist/
```

### Deploy Options

#### Vercel (Recommended)
```bash
vercel deploy
```
- Auto-deploys from Git
- Zero-config for Vite
- Environment variables in dashboard

#### Netlify
```bash
netlify deploy --prod --dir=dist
```

#### Traditional Hosting
1. `npm run build`
2. Upload `dist/` folder
3. Set environment variables
4. Configure redirects (SPA routing)

### Environment Variables
Set these in your hosting dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APPS_SCRIPT_URL`

---

## 📖 Routes & Navigation

| Path | Component | Auth | Role | Purpose |
|------|-----------|------|------|---------|
| `/` | Index | - | - | Home with map |
| `/login` | UserLogin | ❌ | - | User registration |
| `/profile` | UserProfile | ✅ | user | User settings |
| `/auth/callback` | AuthCallback | - | - | OAuth callback |
| `/admin/login` | AdminLogin | ❌ | - | Admin login |
| `/admin` | AdminHome | ✅ | admin | Dashboard |
| `/admin/users` | AdminUsers | ✅ | admin | User mgmt |
| `/admin/reviews` | AdminReviews | ✅ | admin | Review mod |
| `/admin/data-dashboard` | DataDashboard | ✅ | admin | Analytics |

---

## 📋 Common Tasks

### Add New Place
1. Admin enters data in Google Sheet
2. Google Apps Script syncs to Supabase
3. Refresh app to see new place on map

### Manage Users
1. Login to `/admin/login`
2. Navigate to `/admin/users`
3. Create/Edit/Delete users
4. Can reset passwords via Edge Function

### Moderate Reviews
1. Go to `/admin/reviews`
2. Search for inappropriate content
3. Click delete button to remove

### View Analytics
1. Go to `/admin/data-dashboard`
2. View user/review/place statistics
3. Charts update in real-time

---

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [Goong Maps](https://docs.goong.io)
- [MapLibre GL](https://maplibre.org/maplibre-gl-js)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Contributors

- **Kharis** - Original Developer

---

**Made with ❤️ for Vietnam Travel Exploration**

