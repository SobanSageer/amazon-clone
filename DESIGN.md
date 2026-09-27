# Marlo — Design Notes

**Marlo** is a clean, modern e-commerce store built as a design rebrand of an
Amazon-clone codebase. The goal was to replace Amazon's dense, high-contrast
visual language with a calmer, more intentional aesthetic while keeping every
feature fully functional.

## Design decisions

- **Palette.** Deep teal (`#0F5F57`) as the primary accent, warm off-white
  (`#FBFAF8`) page background, and white card surfaces. All colours live in a
  single Tailwind `@theme` block as `m-*` tokens so nothing is hardcoded.
- **Typography.** Inter (Google Fonts, `next/font`) replaces the Amazon system
  stack. One weight ramp handles body and headings — no display font.
- **Layout.** Amazon's dark header/footer and multi-row nav bar are replaced with
  a single white header bar, a light category strip, and a minimal light footer.
  The visual weight shifts from the chrome to the content.
- **Buttons.** Primary actions (Add to Cart, Proceed to Checkout, Place Order)
  use solid teal with white text. Secondary actions use a bordered pill on white.
  Amazon's yellow/orange CTA hierarchy is gone.
- **Figma source.** A Figma file (`DW7B82r6pH2ueTwjSqlLMN`) was created first
  with the full token set and key screens; the code references those tokens 1:1.

## What was cut from Amazon's design, and why

- **Dark header chrome.** Amazon's dark navy header anchors its brand but adds
  visual density. Marlo uses a white header with a border to let products stand
  out against the page background.
- **Multi-tier navigation.** Amazon's category mega-menus and department bars
  serve millions of SKUs. With ~150 products, a single horizontal category strip
  plus full-text search covers the catalogue without clutter.
- **Deals / coupons / badges.** Amazon layers "Limited time deal", "Save 20%",
  "Climate Pledge Friendly", and similar badges on every card. Marlo keeps price
  and rating only — enough for a 150-product store.
- **Yellow/orange CTA palette.** Amazon's signature amber buttons carry decades
  of brand recognition. Marlo uses teal to match its own identity and to avoid
  looking like an Amazon skin.
- **Personalisation rails.** "Inspired by your browsing history", "Customers who
  bought this also bought" — these need real user data. Marlo shows category-based
  rails and top-rated products instead.
