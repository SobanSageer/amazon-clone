# PLAN.md — Amazon Clone (24-hour build)

Judged on: speed (working product), product judgement (what's built first / left out),
UX-UI quality. Must be live, deployed, and usable by anyone without logging in as me.

Grounded in `docs/screenshots/`: Homepage, Search autocomplete, results+filters, product
page, add-to-cart, cart, buy-now checkout, shipping-address modal, sign-in, and the full
6-step signup/OTP flow (email → password → email OTP → WhatsApp OTP fallback → add mobile
number). Real Amazon's checkout is a full-page-reload, accordion-stepped flow with ad
modules (protection plans, "Ask Alexa", gift-card upsell) bolted onto the buy box — none
of that clutter is worth reproducing in 24 hours.

---

## Core loop

The one path that has to work end-to-end, for a signed-out visitor, before anything else
matters:

**Browse → Search → Product page → Cart → Checkout → Order confirmation → Order history**

Plus a **Buy Now** shortcut from the product page (add to cart → straight to checkout),
matching the real Amazon screenshots.

Everything else (filters, sort, protection plans, recommendations, account settings) is
decoration on top of this loop. If the clock runs out, this loop being solid beats five
loops being half-built.

---

## Build order (phased, each phase ends deployable)

Target: the full core loop (Phases 0–6) live in **~8–10 hours**, leaving the rest of the
24h window for the polish pass and slack. Every screen is built mobile-responsive from
the moment it's built — responsiveness is not a separate pass at the end.

Each phase ends with: build with the `frontend-design` skill throughout → a single
batched review pass with `design-critique`, `ux-copy`, and `accessibility-review` on
that phase's screens → fix what those surface → deploy. Reviews run once per phase, not
after every individual change, so feedback gets addressed as one coherent pass instead of
fragmenting the work.

### Phase 0 — Skeleton, DB, deploy pipeline (~0.5–1h)
Next.js (App Router, TS) scaffold, Tailwind + shadcn/ui installed, Prisma connected to
Neon via the Vercel Storage integration (pooled `DATABASE_URL` + direct `DIRECT_URL`,
`prisma generate` wired into the build step), `AUTH_SECRET` set, `next.config` image
domain allow-listed for DummyJSON's CDN, empty header/footer shell, pushed to GitHub,
deployed to Vercel. Goal: a live URL exists before any product code does, so every phase
after this is a diff against something already working in production.

### Phase 1 — Browse (~1.5h)
Seed ~150–200 products (DummyJSON) with images, ratings, categories, plus one seeded
demo user account. Homepage with category rails + product grid. Product card component
(image, title, price, rating). Mobile-responsive grid from the start. **Deploy.**

### Phase 2 — Search & product page (~2h)
Search bar → results page (query param driven), category/price filters, sort. Product
detail page: gallery, title, price, specs, description, rating, **Add to Cart** and
**Buy Now** (skips cart, goes straight to checkout), and a **"More in this category"**
rail pulling real products from the same category — not a fabricated recommendation
engine. **Deploy.**

### Phase 3 — Cart, guest-capable (~1h)
Cart page: line items, quantity edit, remove, subtotal. Cart persists for guests via a
cookie-scoped session id — no login required to build or hold a cart, matching how real
Amazon lets you shop before it ever asks for an account. **Deploy.**

### Phase 4 — Auth, login only at checkout (~1h)
Auth.js credentials sign-in/sign-up (single email+password screen, no OTP/phone
verification — see "Left out"). Guest cart merges into the account's cart on login. A
seeded demo account plus a **"Continue as demo user"** button on the checkout sign-in
step, so reviewers can walk the full loop without creating an account. Nothing before
checkout requires being signed in. **Deploy.**

### Phase 5 — Checkout & simulated payment (~2.5h)
Address form (reuses the field set from the real shipping-address modal: name, phone,
street, unit, city, state, zip), a fake card form (client-side format validation only,
no real gateway, no real charge), order review, place order → order confirmation page
with order number and summary. **Deploy.**

### Phase 6 — Order history (~0.5h)
"Your Orders" page: list of past orders, status, line items, link back to confirmation
detail. **Deploy.** — Core loop is now complete end-to-end.

### Phase 7 — Cross-cutting polish (remaining time)
Since each phase already got its own review-and-fix batch, this pass is about
consistency across the whole app rather than first-time review: a full click-through of
the core loop, visual/spacing/copy consistency across phases, empty/loading/error states
anywhere missed, a final accessibility sweep, final deploy.

---

## Left out on purpose

| Cut | Why |
|---|---|
| Prime Video, Alexa, Coupons, Registry, Whole Foods, Pharmacy, Subscriptions | Not the core commerce loop — separate products bolted onto amazon.com's nav, zero relation to browse→buy. |
| Seller Central / "Sell" flow | This is a buyer-side clone; a seller marketplace is a second, unrelated application. |
| Real payments (Stripe/etc.) | Assignment explicitly wants simulated payment; wiring a real gateway is scope and risk (PCI, real charges) for zero judged benefit. |
| Email OTP + WhatsApp/SMS phone verification at signup | Real Amazon's screenshots show a 4-step identity-verification gauntlet; it demos account-security maturity, not commerce UX, and burns hours on a canary account. Single email+password (plus a one-click demo-user login) is enough to prove "login gates checkout." |
| Product reviews (writing them) | Ratings are seeded and shown read-only; a review-authoring + moderation system is a separate feature with no payoff in a buy-flow demo. |
| Wishlists / "Save for later" / "Buy it again" | Secondary retention features, not part of the core loop. |
| Protection plans / gift cards / "Add a new Amazon Visa" upsells | Pure monetization surface on the buy box; adds visual clutter without demonstrating engineering or UX judgement. |
| ML-style recommendation engine ("customers also bought", personalized) | Needs real usage data to not look fake; a hardcoded "you might also like" rail would be theater. (A same-category "More in this category" rail is in scope — it's real data, not a fabricated model.) |
| Order tracking / carrier integration / returns & refunds | Post-purchase logistics is a large separate domain; order history with a status field is enough to close the loop. |
| Admin/inventory dashboard | Not in the buyer-facing core loop; seeding covers inventory needs for this build. |
| Multi-currency / international shipping | One currency, one country (US) keeps checkout and tax math simple and correct rather than broad and buggy. |

---

## Where we can beat Amazon

1. **Instant search** — client-side, debounced, results update without a page reload
   (real Amazon's autocomplete is a mix of product suggestions and ad-adjacent noise,
   then a full navigation to a server-rendered results page). Feels faster because it is.

2. **One clean checkout, not an accordion maze** — the screenshots show Amazon's
   checkout as three collapsed sections (address / payment / review) that reveal
   themselves across page loads with tax-disclaimer legalese wedged between them. A
   single-page checkout (address → payment → review, all visible, one submit) removes
   the back-and-forth without losing any information the buyer needs.

3. **A product page with one job** — no protection-plan checkboxes, no "Ask Alexa"
   chat bubble, no sponsored "similar item" card competing with the real one. Image,
   title, price, specs, description, Add to Cart / Buy Now, and an honest
   same-category rail. Everything else is a distraction from the decision the page
   exists to support.

---

## Data model

```
User
  id            String   @id
  email         String   @unique
  passwordHash  String
  name          String
  isDemo        Boolean  @default(false)   // the seeded "Continue as demo user" account
  createdAt     DateTime

Address
  id            String   @id
  userId        String   -> User
  fullName      String
  phone         String
  street        String
  unit          String?
  city          String
  state         String
  zip           String
  country       String   // "US" only for v1
  isDefault     Boolean

Category
  id            String   @id
  name          String
  slug          String   @unique
  imageUrl      String?

Product
  id            String   @id
  title         String
  slug          String   @unique
  description   String
  brand         String?
  price         Decimal
  images        String[]
  rating        Float
  ratingCount   Int
  stock         Int
  categoryId    String   -> Category

CartItem
  id            String   @id
  userId        String?  -> User        // null while guest
  sessionId     String?                 // cookie-scoped id while guest; nulled after merge
  productId     String   -> Product
  quantity      Int

Order
  id            String   @id
  orderNumber   String   @unique        // shown on confirmation, human-facing
  userId        String   -> User
  addressId     String   -> Address
  status        String                  // "placed" for v1; room to grow later
  subtotal      Decimal
  tax           Decimal
  shippingFee   Decimal
  total         Decimal
  createdAt     DateTime

OrderItem
  id            String   @id
  orderId       String   -> Order
  productId     String   -> Product
  titleSnapshot String                  // frozen at purchase time
  priceSnapshot Decimal                 // frozen at purchase time — price can drift later
  quantity      Int
```

`CartItem` carries both `userId` and `sessionId` so a guest can add to cart with no
account, and on login/checkout the guest session's items are reassigned to `userId` and
`sessionId` is cleared — this is what makes "guest browsing, login only at checkout"
actually work end to end rather than just being a claim in the nav bar.

`OrderItem` snapshots title/price at purchase time rather than joining live to `Product`,
so an order placed today still reads correctly if the product's price or listing changes
later — standard e-commerce practice, and cheap to get right now versus painful to retrofit.

`User.isDemo` flags the single seeded account the "Continue as demo user" button logs
into, so reviewers can exercise checkout and order history without ever creating an
account of their own.

---

Approved 2026-09-21. Building now, starting with Phase 0.
