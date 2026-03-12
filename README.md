# Chain Salad — Ebook Store

A production-ready starter for selling a single ebook PDF using **Stripe Checkout**, **AWS S3**, **Prisma ORM**, and **Next.js** (App Router).

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **Stripe Checkout** for payments
- **AWS S3** for ebook PDF storage (private bucket with presigned URLs)
- **Prisma ORM** with SQLite (easily switchable to Postgres)
- **TailwindCSS** for styling
- **ZeptoMail** for transactional emails
- **Zod** for validation

## Architecture

```
/app
  page.tsx              → Landing page ("Coming Soon")
  /store/page.tsx       → Book listing
  /store/book1/page.tsx → Book detail & purchase
  /success/page.tsx     → Payment confirmation & download
  /cancel/page.tsx      → Payment cancelled

/app/api
  /create-checkout-session/route.ts → Creates Stripe session
  /webhook/route.ts                 → Handles Stripe events
  /download/route.ts                → Generates S3 download URL

/lib
  db.ts     → Prisma client singleton
  stripe.ts → Stripe SDK init
  s3.ts     → S3 client & presigned URLs
  email.ts  → ZeptoMail helper
  env.ts    → Zod env validation
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (see sections below).

### 3. Initialize the database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Configure Stripe

1. Create a [Stripe account](https://dashboard.stripe.com/register).
2. Get your **test mode** keys from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys).
3. Set in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Webhook Setup (Local Testing)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login: `stripe login`
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
4. Copy the webhook signing secret (`whsec_...`) and set it in `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Test Cards

| Card Number         | Scenario         |
| ------------------- | ---------------- |
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined          |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

---

## Setup AWS S3

1. Create an S3 bucket in your AWS account.
2. **Keep the bucket private** — do NOT enable public access.
3. Upload your ebook PDF to the bucket (e.g. `ebooks/your-ebook.pdf`).
4. Create an IAM user with `s3:GetObject` permission on the bucket.
5. Set in `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=ap-south-1
   AWS_BUCKET_NAME=your-bucket-name
   S3_EBOOK_KEY=ebooks/your-ebook.pdf
   ```

The app generates presigned URLs that expire in **5 minutes**. Users can always regenerate a download link from the success page.

---

## Setup ZeptoMail

1. Create a [ZeptoMail account](https://www.zoho.com/zeptomail/).
2. Verify your sending domain.
3. Get your API key from ZeptoMail console.
4. Set in `.env`:
   ```
   ZEPTOMAIL_API_KEY=your_api_key
   ZEPTOMAIL_FROM_EMAIL=noreply@yourdomain.com
   ZEPTOMAIL_FROM_NAME="Chain Salad"
   ```

> **Note:** The app gracefully handles missing ZeptoMail config — emails will be skipped if not configured, so you can run locally without it.

---

## Test Payments (End-to-End)

1. Start the dev server: `npm run dev`
2. In another terminal, start Stripe listener: `stripe listen --forward-to localhost:3000/api/webhook`
3. Go to `/store/book1`, enter an email, click **Buy Now**
4. Use test card `4242 4242 4242 4242`
5. After payment, you'll be redirected to `/success?session_id=...`
6. Click **Download** to get the presigned S3 URL
7. Check your terminal for webhook logs and database entries

### Verify database records

```bash
npx prisma studio
```

This opens a web UI to browse your `UserPurchase` table.

---

## Switching to Postgres

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

Then run:

```bash
npx prisma db push
```

---

## License

MIT