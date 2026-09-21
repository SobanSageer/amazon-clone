import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MapPin, Package, Plus } from "lucide-react";
import { currentUser } from "@/auth";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { AddressForm, NameForm, PasswordForm } from "@/components/account-forms";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Your Account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/account");
  const sp = await props.searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : null;
  const adding = sp.add === "1";

  const addresses = await db.address.findMany({
    where: { userId: user.id, archived: false },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });
  const editing = editId ? addresses.find((a) => a.id === editId) : undefined;

  const card = "rounded-lg border border-[#d5d9d9] bg-white p-5";
  const linkBtn = "text-[13px] text-amz-link hover:text-amz-link-hover hover:underline";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-[28px] font-normal text-[#0f1111]">Your Account</h1>

      <nav aria-label="Account shortcuts" className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/orders", icon: Package, title: "Your Orders", body: "Track, cancel, or buy things again" },
          { href: "/list", icon: Heart, title: "Your List", body: "Products you saved for later" },
          { href: "#addresses", icon: MapPin, title: "Your Addresses", body: "Edit addresses for orders" },
        ].map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} className={`${card} flex gap-3 hover:bg-[#f7fafa] focus-visible:outline-2 focus-visible:outline-[#007185]`}>
            <Icon className="size-8 shrink-0 text-amz-link" strokeWidth={1.5} aria-hidden />
            <span>
              <span className="block text-base text-[#0f1111]">{title}</span>
              <span className="block text-sm text-zinc-600">{body}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="security-heading" className={`${card} mt-6`}>
        <h2 id="security-heading" className="text-lg font-bold text-[#0f1111]">
          Login & security
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Email: <span className="text-[#0f1111]">{user.email}</span>
        </p>
        <div className="mt-4">
          <NameForm name={user.name} />
        </div>
        <hr className="my-5 border-zinc-200" />
        <h3 className="mb-3 text-base font-bold text-[#0f1111]">Change password</h3>
        <PasswordForm />
      </section>

      <section id="addresses" aria-labelledby="addresses-heading" className={`${card} mt-6 scroll-mt-4`}>
        <div className="flex items-center justify-between">
          <h2 id="addresses-heading" className="text-lg font-bold text-[#0f1111]">
            Your Addresses
          </h2>
          {!adding && !editing && (
            <Link href="/account?add=1#addresses" className={`${linkBtn} flex items-center gap-1`}>
              <Plus className="size-4" aria-hidden /> Add address
            </Link>
          )}
        </div>

        {(adding || editing) && (
          <div className="mt-4">
            <h3 className="mb-2 text-base font-bold text-[#0f1111]">{editing ? "Edit address" : "Add a new address"}</h3>
            <AddressForm initial={editing} />
          </div>
        )}

        {addresses.length === 0 && !adding ? (
          <p className="mt-3 text-sm text-zinc-600">No saved addresses yet. Addresses you use at checkout are saved here.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex flex-col rounded-lg border border-[#d5d9d9] p-4 text-sm text-[#0f1111]">
                {a.isDefault && <p className="mb-2 border-b border-zinc-200 pb-2 text-xs text-zinc-600">Default</p>}
                <p className="font-bold">{a.fullName}</p>
                <p>
                  {a.street}
                  {a.unit ? `, ${a.unit}` : ""}
                </p>
                <p>
                  {a.city}, {a.state} {a.zip}
                </p>
                <p>Phone number: {a.phone}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/account?edit=${a.id}#addresses`} className={linkBtn}>
                    Edit
                  </Link>
                  <span className="text-zinc-300" aria-hidden>
                    |
                  </span>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className={linkBtn}>
                      Remove<span className="sr-only"> address for {a.fullName}, {a.street}</span>
                    </button>
                  </form>
                  {!a.isDefault && (
                    <>
                      <span className="text-zinc-300" aria-hidden>
                        |
                      </span>
                      <form action={setDefaultAddressAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className={linkBtn}>
                          Set as Default
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
