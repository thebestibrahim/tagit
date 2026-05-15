# Tagit — Luxury Goods Identity Platform

Tagit lets brands attach verifiable digital identities to physical luxury items. Each tag contains a unique HMAC-signed identifier that links to a product passport — ownership history, authenticity certificate, and brand experience — accessible via a simple scan.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database & Auth | Supabase (Postgres + Row Level Security) |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (for database and auth)

### Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/thebestibrahim/tagit.git
   cd tagit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root (never commit this):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   HMAC_SECRET=your_hmac_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
tagit/
├── app/                  # Next.js App Router — pages and API routes
│   ├── api/              # Server-side API handlers
│   ├── admin/            # Admin dashboard
│   ├── dashboard/        # Brand/company dashboard
│   └── scan/             # Public tag scan page
├── components/           # Shared React components
├── lib/                  # Utilities, Supabase client, helpers
└── public/               # Static assets
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, PR process, and code standards.

## Environment Variables

All secrets are managed via `.env.local` (local) and Vercel environment variables (production). See `.env.local` structure above. **Never commit `.env*` files.**
