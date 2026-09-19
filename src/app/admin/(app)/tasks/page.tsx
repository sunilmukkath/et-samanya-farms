import { completeTaskAction, deriveTasksAction } from "@/app/admin/actions";
import { listTasks } from "@/db/queries";
import { getRuntimeFarm } from "@/lib/profile";
import Link from "next/link";

export default async function TasksPage() {
  const [open, runtime] = await Promise.all([listTasks(false), getRuntimeFarm()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-display text-3xl sm:text-4xl">Work list</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Recheck stressed trees, turn compost, inspect drip after rain. Ticking a task means you did the walk —
        log what you saw.
      </p>
      <form action={deriveTasksAction} className="mt-4">
        <button type="submit" className="tap rounded-full bg-leaf-deep px-5 text-sm font-semibold text-cream">
          Derive from logs
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {open.length === 0 ? (
          <li className="rounded-3xl border border-line bg-white px-4 py-6 text-sm text-ink-soft">
            No open tasks.{" "}
            <Link href="/admin/log" className="font-semibold text-leaf-deep">
              Log
            </Link>{" "}
            a note, then derive a list.
          </li>
        ) : (
          open.map((task) => (
            <li key={task.id} className="rounded-3xl border border-line bg-white px-4 py-4">
              <p className="font-display text-xl leading-tight">{task.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                {task.source} {task.domain ? `· ${runtime.domainBySlug[task.domain]?.label ?? task.domain}` : ""}
              </p>
              <div className="mt-3 flex gap-2">
                {task.domain ? (
                  <Link
                    href={`/admin/log?domain=${task.domain}${task.treeId ? `&treeId=${task.treeId}` : ""}`}
                    className="tap rounded-full bg-leaf-deep px-4 text-sm font-semibold leading-[40px] text-cream"
                  >
                    Log it
                  </Link>
                ) : null}
                <form action={completeTaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <button type="submit" className="tap rounded-full border border-line px-4 text-sm font-semibold leading-[40px]">
                    Done
                  </button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
