# SecurePay Checkout 🚀

SecurePay is a refined, high-performance, and cryptographically secure Zambian payment checkout web application integrated with the **Lenco BroadPay** API. It supports standard card transactions and instant Mobile Money STK push requests.

This codebase has been optimized with a multi-agent system to include a refined SDK, cryptographic webhook validation, and a **real-time Server-Sent Events (SSE)** synchronization layer with a smooth polling fallback.

---

## ⚡ Execution Guidelines (For Antigravity IDE)

If you are running an agent or executing commands in the IDE, you can run the commands in the blocks below to install, launch, or deploy the application.

### 1. Local Development Launch
To start the project locally, run the following commands in your shell:

```bash
# 1. Install dependencies
npm install

# 2. Add your environment credentials (refer to the environment section below)
# Create a .env.local file if it does not exist
echo "LENCO_PUBLIC_KEY=pk_test_your_public_key" > .env.local
echo "LENCO_SECRET_KEY=sk_test_your_secret_key" >> .env.local

# 3. Spin up the local development server
npm run dev
```
Once started, the application will be live at **`http://localhost:3000/pay`**.

---

### 2. Vercel Production Deployment
This project is configured to run flawlessly on **Vercel** as a serverless application.

#### Option A: Vercel CLI (Recommended for fast IDE deployment)
If you have the `vercel` CLI installed, run the following sequence to launch the site instantly:

```bash
# 1. Login to your Vercel account
vercel login

# 2. Link and deploy the project
vercel link
vercel env add LENCO_PUBLIC_KEY
vercel env add LENCO_SECRET_KEY

# 3. Build and deploy to production
vercel deploy --prod
```

#### Option B: Vercel Web Dashboard Launch
1. Push this repository to **GitHub / GitLab / Bitbucket**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Under **Environment Variables**, configure:
   - `LENCO_PUBLIC_KEY` = `pk_test_your_public_key`
   - `LENCO_SECRET_KEY` = `sk_test_your_secret_key`
4. Click **Deploy**. Vercel will automatically detect the Next.js setup, build the static pages, and spin up the Serverless API routes.

---

## 🔑 Environment Configuration

For the payment checkout flow and webhooks to function correctly, ensure the following environment keys are defined:

| Key | Scope | Description |
| :--- | :--- | :--- |
| `LENCO_PUBLIC_KEY` | Client & Server | Your public key from Lenco (used to initialize the inline card iframe widget). |
| `LENCO_SECRET_KEY` | Server Only | Your private secret key from Lenco (used to initiate mobile money STK pushes and sign webhook HMAC hashes). |

*Note: In development, place these in `.env.local`. For production, add them directly to Vercel Project Settings.*

---

## 📡 Webhook Setup (Zambian Mobile Money Notification)

To ensure the UI receives real-time transaction updates whenMTN or Airtel users complete their STK prompt:
1. Navigate to your **Lenco Dashboard** under **Developer Settings**.
2. Set the Webhook URL to:
   `https://<your-deployed-domain>.vercel.app/api/lenco/webhook`
3. Lenco will cryptographically sign all updates using your `LENCO_SECRET_KEY`. The SecurePay server validates these requests using `HMAC-SHA512` checks through standard `crypto.timingSafeEqual` buffers before broadcasting the status changes.

---

## 🏗️ Technical Architecture Details

For the IDE agent's context, the core operational components are configured as follows:

* **SDK Integration (`lenco-module/lib/lenco.ts`)**: Derives country codes (`zm` or `mw`) from currency types or prefixes, formats mobile numbers into clean international format (e.g. `2609xxxxxxxx`), and wraps fetch functions in standardized `LencoResponse` handlers.
* **Consolidated Entrypoint (`/api/lenco/initiate`)**: A single, clean API endpoint that acts as the coordinator for all incoming mobile money and card widgets.
* **Shared Payment Emitter (`lib/payment-emitter.ts`)**: A `globalThis`-bound Node `EventEmitter` instance that survives Next.js HMR (Hot Module Replacement) reloads in local development without losing listeners.
* **SSE Endpoint (`/api/status/[reference]/stream/route.ts`)**: Streams status updates to the client in real-time, shutting down cleanly upon receiving `successful`, `failed`, or `cancelled` terminal statuses.
* **Dynamic Loading Widget (`CheckoutPage.tsx` / `LencoPaymentStatus.tsx`)**: Attaches an inline loader that downloads `inline.js` on demand, listens to SSE updates, and automatically switches to progressive adaptive polling if connection is lost for 8 seconds.
