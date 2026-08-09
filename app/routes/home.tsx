import {
  BellIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  DotsThreeOutlineIcon,
  FlowerLotusIcon,
  GearSixIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionIcon,
  SparkleIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Iris" },
    { name: "description", content: "A close-up study of an iris in bloom." },
  ];
}

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(72vh,48rem)] bg-cover bg-bottom bg-no-repeat opacity-55 grayscale-[40%] [mask-image:linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
        style={{ backgroundImage: "url('/iris.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(72vh,48rem)] bg-gradient-to-t from-transparent via-background/35 to-background"
      />

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center bg-primary text-primary-foreground">
            <FlowerLotusIcon size={18} weight="bold" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight">IRIS</span>
          <span className="hidden border-l border-border pl-3 text-xs text-muted-foreground sm:block">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" aria-label="Search">
            <MagnifyingGlassIcon size={18} />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <BellIcon size={18} />
          </Button>
          <div className="ml-2 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
            <div className="grid size-7 place-items-center bg-primary text-[10px] font-bold text-primary-foreground">
              AI
            </div>
            <CaretDownIcon size={14} className="text-muted-foreground" />
          </div>
        </div>
      </header>
      <div className="flex">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-primary">
                  <SparkleIcon size={15} weight="fill" />
                  GOOD MORNING
                </p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
                <p className="mt-2 text-sm text-muted-foreground">A quiet place to keep your ideas in bloom.</p>
              </div>
              <Button>
                <PlusIcon size={16} weight="bold" data-icon="inline-start" />
                New collection
              </Button>
            </div>

            <section className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Collections", "12", "Growing archive"],
                ["Notes this week", "48", "+16% from last week"],
                ["In bloom", "06", "Ideas in progress"],
              ].map(([label, value, detail]) => (
                <article key={label} className="bg-card p-5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-5 font-heading text-3xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs text-primary">{detail}</p>
                </article>
              ))}
            </section>

            <section className="mt-7 border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">Recent studies</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Your latest observations and fragments.</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="More options">
                  <DotsThreeOutlineIcon size={18} weight="fill" />
                </Button>
              </div>
              <div className="grid min-h-44 place-items-center p-5 text-center">
                <FlowerLotusIcon size={26} className="text-primary" weight="duotone" />
                <p className="-mt-6 text-sm text-muted-foreground">Your next idea can start here.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
