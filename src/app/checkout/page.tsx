import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Login gate for checkout. The checkout itself lands in Phase 5.
export default async function CheckoutPage() {
  if (!(await auth())?.user) redirect("/signin?callbackUrl=/checkout");
  redirect("/cart");
}
