import {
  areas,
  openQuestions,
  statusLabels,
  statusStyles,
  type RoadmapItem,
} from "@/data/roadmap";
import { lockAction } from "@/app/backstage/actions";

function StatusPill({ status }: { status: RoadmapItem["status"] }) {
  return (
    <span
      className={`shrink-0 px-2 py-0.5 text-[10px] border rounded-full whitespace-nowrap ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Item({ item }: { item: RoadmapItem }) {
  const isDone = item.status === "done";
  return (
    <li className="py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className={isDone ? "text-gray-400 line-through" : ""}>
          {item.title}
        </span>
        <StatusPill status={item.status} />
      </div>
      {item.note && (
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed pr-16">
          {item.note}
        </p>
      )}
    </li>
  );
}

export default function Roadmap() {
  const all = areas.flatMap((area) => area.items);
  const done = all.filter((item) => item.status === "done").length;

  return (
    <div className="pt-12 pb-24">
      <header className="pb-8 border-b border-black">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl md:text-4xl">backstage</h1>
          <form action={lockAction}>
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              lock
            </button>
          </form>
        </div>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Everything this site could become, and what it would take. Nothing
          here is a promise.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {done} of {all.length} done · tick things off by editing{" "}
          <code className="text-gray-500">data/roadmap.ts</code>
        </p>
      </header>

      {openQuestions.length > 0 && (
        <section className="mt-10 border border-black p-5">
          <h2 className="text-sm uppercase tracking-wider text-gray-500">
            open questions
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Answering these unblocks whole areas below.
          </p>
          <ul className="mt-4 space-y-3">
            {openQuestions.map((question) => (
              <li key={question} className="text-sm leading-relaxed flex gap-3">
                <span aria-hidden className="text-gray-300 select-none">
                  ?
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {areas.map((area) => {
        const areaDone = area.items.filter((i) => i.status === "done").length;
        return (
          <section key={area.name} className="mt-12">
            <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-black">
              <h2 className="text-xl">{area.name}</h2>
              <span className="text-xs text-gray-400 shrink-0">
                {areaDone}/{area.items.length}
              </span>
            </div>

            {area.blurb && (
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {area.blurb}
              </p>
            )}

            <ul className="mt-2">
              {area.items.map((item) => (
                <Item key={item.title} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
