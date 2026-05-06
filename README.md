# SecurePay Checkout

SecurePay is a production-ready Zambian payment checkout UI integrated with the Lenco API by BroadPay.

## Features

- **Mobile Money STK Push**: Instant payment requests to MTN and Airtel users in Zambia.
- **Card Payments**: Integrated Lenco widget for seamless card transactions.
- **Real-time Status Polling**: Automatic UI updates based on transaction status (Pending, Success, Failed).
- **Responsive Design**: Premium, minimalistic Tailwind CSS UI optimized for all devices.
- **Secure Architecture**: Server-side API handlers securely manage Lenco secret keys.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/securepay-checkout.git
   cd securepay-checkout
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and add your actual Lenco API keys.
   ```bash
   cp .env.local.example .env.local
   ```
   *Note: Ensure you set `LENCO_PUBLIC_KEY`, `LENCO_SECRET_KEY`, and `LENCO_BASE_URL` properly.*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lenco API SDK](https://docs.lenco.co/)

## Deployment

Deployable via [Vercel](https://vercel.com/new). Ensure all environment variables are correctly configured in your Vercel project settings.
