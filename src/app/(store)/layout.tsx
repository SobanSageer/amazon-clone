import { MeProvider } from "@/components/header-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </MeProvider>
  );
}
