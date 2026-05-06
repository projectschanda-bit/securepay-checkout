import { Metadata } from "next";
import CheckoutPage from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "SecurePay | Checkout",
  description: "Secure Zambian payment checkout powered by Lenco API.",
};

export default function PayRoute() {
  return <CheckoutPage />;
}
