import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative isolate min-h-screen w-full max-w-[1180px] overflow-hidden bg-background text-foreground min-[1181px]:border min-[1181px]:border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(42vh,48rem)] bg-cover bg-top-right bg-no-repeat opacity-55 grayscale-40 [mask-image:linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
        style={{ backgroundImage: "url('/iris.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(42vh,48rem)] bg-gradient-to-t from-transparent via-background/35 to-background"
      />

      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/iris-background-removed.png"
            alt="Iris"
            className="size-8 object-contain"
          />
          <span className="font-heading text-sm font-semibold tracking-tight">IRIS</span>
          <span className="hidden border-l border-border pl-3 text-xs text-muted-foreground sm:block">
            Collections
          </span>
        </div>
      </header>

      {children}
    </div>
  );
}
