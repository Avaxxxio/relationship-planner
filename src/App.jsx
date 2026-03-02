import { useEffect, useMemo, useState } from "react";

const categories = [
  { key: "movies", label: "Movies", accent: "amber" },
  { key: "restaurants", label: "Restaurants", accent: "rose" },
  { key: "happenings", label: "Happenings", accent: "violet" },
  { key: "videogames", label: "Videogames", accent: "emerald" },
  { key: "activities", label: "Activities", accent: "sky" },
  { key: "trips", label: "Trips", accent: "orange" },
];

const STORAGE_KEY = "relationship-planner-items";

// Light-theme accents (focus rings + slider)
const accentStyles = {
  amber: { ring: "focus:ring-amber-300/60", accent: "accent-amber-600" },
  rose: { ring: "focus:ring-rose-300/60", accent: "accent-rose-600" },
  violet: { ring: "focus:ring-violet-300/60", accent: "accent-violet-600" },
  emerald: { ring: "focus:ring-emerald-300/60", accent: "accent-emerald-600" },
  sky: { ring: "focus:ring-sky-300/60", accent: "accent-sky-600" },
  orange: { ring: "focus:ring-orange-300/60", accent: "accent-orange-600" },
};

// Per-category blob palettes (each blob has two nearby colors for subtle shifting)
// Values are "R G B" strings so we can use rgb(var(--b1a)) etc.
const blobPalettes = {
  amber: {
    b1a: "251 191 36", // amber-400
    b1b: "253 230 138", // amber-200
    b2a: "251 146 60", // orange-400
    b2b: "254 215 170", // orange-200
    b3a: "244 114 182", // pink-400
    b3b: "253 164 175", // rose-300-ish
  },
  rose: {
    b1a: "244 63 94", // rose-500
    b1b: "254 205 211", // rose-200
    b2a: "251 113 133", // rose-400
    b2b: "253 164 175", // rose-300
    b3a: "253 186 116", // orange-300
    b3b: "254 215 170", // orange-200
  },
  violet: {
    b1a: "167 139 250", // violet-400
    b1b: "221 214 254", // violet-200
    b2a: "129 140 248", // indigo-400
    b2b: "199 210 254", // indigo-200
    b3a: "244 114 182", // pink-400
    b3b: "251 207 232", // pink-200
  },
  emerald: {
    b1a: "16 185 129", // emerald-500
    b1b: "167 243 208", // emerald-200
    b2a: "34 197 94", // green-500
    b2b: "187 247 208", // green-200
    b3a: "14 165 233", // sky-500
    b3b: "186 230 253", // sky-200
  },
  sky: {
    b1a: "14 165 233", // sky-500
    b1b: "186 230 253", // sky-200
    b2a: "59 130 246", // blue-500
    b2b: "191 219 254", // blue-200
    b3a: "34 211 238", // cyan-400
    b3b: "165 243 252", // cyan-200
  },
  orange: {
    b1a: "249 115 22", // orange-500
    b1b: "254 215 170", // orange-200
    b2a: "245 158 11", // amber-500
    b2b: "253 230 138", // amber-200
    b3a: "244 63 94", // rose-500
    b3b: "254 205 211", // rose-200
  },
};

function Tab({ active, tone, children, onClick }) {
  // Outline tabs that fill the whole bar
  const toneText =
    tone === "emerald"
      ? "text-emerald-900"
      : tone === "sky"
        ? "text-sky-900"
        : tone === "violet"
          ? "text-violet-900"
          : tone === "rose"
            ? "text-rose-900"
            : tone === "orange"
              ? "text-orange-900"
              : "text-amber-900";

  const toneBorder =
    tone === "emerald"
      ? "border-emerald-300/70"
      : tone === "sky"
        ? "border-sky-300/70"
        : tone === "violet"
          ? "border-violet-300/70"
          : tone === "rose"
            ? "border-rose-300/70"
            : tone === "orange"
              ? "border-orange-300/70"
              : "border-amber-300/70";

  const activeBg =
    tone === "emerald"
      ? "bg-emerald-50/80"
      : tone === "sky"
        ? "bg-sky-50/80"
        : tone === "violet"
          ? "bg-violet-50/80"
          : tone === "rose"
            ? "bg-rose-50/80"
            : tone === "orange"
              ? "bg-orange-50/80"
              : "bg-amber-50/80";

  return (
    <button
      onClick={onClick}
      type="button"
      className={
        "w-full px-4 py-2.5 rounded-2xl text-sm md:text-base font-semibold cursor-pointer " +
        "transition-all duration-300 border backdrop-blur " +
        (active
          ? `shadow-sm ${activeBg} ${toneBorder} ${toneText}`
          : `bg-transparent border-black/10 text-neutral-700 hover:bg-white/80 hover:border-black/30 hover:-translate-y-0.5 hover:shadow-lg`)
      }
    >
      {children}
    </button>
  );
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("movies");
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showImportPrompt, setShowImportPrompt] = useState(() => {
    if (typeof window === "undefined") return true;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return !stored;
    } catch {
      return true;
    }
  });
  const [importError, setImportError] = useState("");
  const [isDragOverImport, setIsDragOverImport] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState("dateAsc");
  const [onlyNotDone, setOnlyNotDone] = useState(false);
  const [removingIds, setRemovingIds] = useState({});
  const [lastDoneId, setLastDoneId] = useState(null);
  const [lastAddedId, setLastAddedId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    excitement: 5,
    date: "",
  });

  const visibleItems = useMemo(() => {
    const filtered = items.filter((i) => {
      if (i.category !== selectedCategory) return false;
      if (onlyNotDone && i.status === "done") return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "excitementAsc" || sortBy === "excitementDesc") {
        const aVal =
          typeof a.excitement === "number"
            ? a.excitement
            : (a.excitementMe + a.excitementHer) / 2;
        const bVal =
          typeof b.excitement === "number"
            ? b.excitement
            : (b.excitementMe + b.excitementHer) / 2;
        return sortBy === "excitementAsc" ? aVal - bVal : bVal - aVal;
      }

      const aTime = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
      if (sortBy === "dateDesc") return bTime - aTime;
      return aTime - bTime;
    });

    return sorted;
  }, [items, selectedCategory, onlyNotDone, sortBy]);

  function excitementEmoji(value) {
    if (value <= 0) return "😒";
    if (value < 5) return "😐";
    if (value < 8) return "🙂";
    if (value <= 9) return "😁";
    return "🤩";
  }

  function addItem() {
    if (!form.title.trim()) return;
    const id = crypto.randomUUID();
    setItems((prev) => [
      ...prev,
      {
        id,
        category: selectedCategory,
        title: form.title.trim(),
        excitement: Number(form.excitement),
        date: form.date,
        status: "planned",
      },
    ]);
    setLastAddedId(id);
    window.setTimeout(() => setLastAddedId(null), 450);
    setForm((f) => ({ ...f, title: "" }));
  }

  function markDone(id) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "done" } : i))
    );
    setLastDoneId(id);
    window.setTimeout(() => setLastDoneId(null), 420);
  }

  function removeItem(id) {
    setRemovingIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRemovingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 260);
  }

  function exportItems() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `relationship-planner-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function loadItemsFromFile(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextItems = Array.isArray(parsed) ? parsed : parsed?.items;

      if (!Array.isArray(nextItems)) {
        throw new Error("Invalid file shape");
      }

      setItems(nextItems);
      setImportError("");
      setShowImportPrompt(false);
    } catch {
      setImportError("Could not load this JSON file.");
    }
  }

  async function importItems(event) {
    const file = event.target.files?.[0];
    await loadItemsFromFile(file);
    event.target.value = "";
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const selected = categories.find((c) => c.key === selectedCategory);
  const selectedLabel = selected?.label ?? selectedCategory;
  const tone = selected?.accent ?? "amber";
  const ui = accentStyles[tone] ?? accentStyles.amber;
  const palette = blobPalettes[tone] ?? blobPalettes.amber;
  const formExcitement = Number(form.excitement);
  const getItemExcitement = (item) => {
    const value =
      typeof item.excitement === "number"
        ? item.excitement
        : (item.excitementMe + item.excitementHer) / 2;
    return Number.isFinite(value) ? value : 0;
  };
  const displayExcitement = (value) => Math.round(value);

  return (
    <div
      className="min-h-screen text-neutral-950 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50"
      style={{
        "--b1a": palette.b1a,
        "--b1b": palette.b1b,
        "--b2a": palette.b2a,
        "--b2b": palette.b2b,
        "--b3a": palette.b3a,
        "--b3b": palette.b3b,
      }}
    >
      {/* animated glow (palette updates when you switch tabs) */}
      <div className="pointer-events-none fixed inset-0 opacity-85">
        <div
          className="blob absolute top-0 left-0 h-[520px] w-[520px] rounded-full blur-[260px] opacity-35 mix-blend-multiply"
          style={{
            backgroundColor: "rgb(var(--b1a))",
            animation: "blobOrbit1 8s linear infinite, blobColor1 8s ease-in-out infinite",
          }}
        />
        <div
          className="blob absolute top-10 right-0 h-[560px] w-[560px] rounded-full blur-[190px] opacity-50 mix-blend-multiply"
          style={{
            backgroundColor: "rgb(var(--b2a))",
            animation: "blobOrbit2 8s linear infinite, blobColor2 9s ease-in-out infinite",
          }}
        />
        <div
          className="blob absolute bottom-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[210px] opacity-50 mix-blend-multiply"
          style={{
            backgroundColor: "rgb(var(--b3a))",
            animation: "blobOrbit3 8s linear infinite, blobColor3 10s ease-in-out infinite",
          }}
        />
      </div>

      {showImportPrompt && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl rounded-3xl border border-black/10 bg-white/90 p-6 shadow-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Load your planner</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Import a saved JSON file, or continue with an empty planner.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <label
                className={
                  "cursor-pointer rounded-2xl border px-4 py-5 text-center font-semibold text-neutral-800 transition-all duration-300 " +
                  (isDragOverImport
                    ? "border-sky-300 bg-sky-50 shadow-lg"
                    : "border-black/10 bg-white hover:-translate-y-0.5 hover:shadow-lg")
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverImport(true);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragOverImport(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget.contains(event.relatedTarget)) return;
                  setIsDragOverImport(false);
                }}
                onDrop={async (event) => {
                  event.preventDefault();
                  setIsDragOverImport(false);
                  const file = event.dataTransfer.files?.[0];
                  await loadItemsFromFile(file);
                }}
              >
                <div className="text-base">Upload JSON</div>
                <div className="mt-1 text-sm font-medium text-neutral-500">
                  or drag and drop it here
                </div>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={importItems}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setImportError("");
                  setShowImportPrompt(false);
                }}
                className="rounded-2xl border border-black/10 bg-neutral-900 px-4 py-3 font-semibold text-white transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
              >
                Continue without JSON
              </button>
            </div>

            {importError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {importError}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8 py-8">
        <header className="mb-7">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center tracking-tight">
            💛 Our Things
          </h1>
          <p className="text-center text-neutral-700 mt-2">
            Pick a tab. Add plans. Mark them done.
          </p>
        </header>

        {/* Tabs */}
        <div className="sticky top-0 z-10 pb-3">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/10 px-3 py-3 shadow">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {categories.map((c) => (
                  <Tab
                    key={c.key}
                    tone={c.accent}
                    active={selectedCategory === c.key}
                    onClick={() => setSelectedCategory(c.key)}
                  >
                    {c.label}
                  </Tab>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <section className="mt-7 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="flex items-baseline justify-between md:block">
              <h2 className="text-xl font-semibold">{selectedLabel}</h2>
              <div className="text-sm text-neutral-600 md:mt-1">
                {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={exportItems}
                type="button"
                className="px-3.5 py-2 rounded-2xl text-sm font-semibold border border-black/10 bg-white/85 text-neutral-800 transition-all duration-300 cursor-pointer hover:bg-white hover:-translate-y-0.5 hover:shadow-lg"
              >
                Export
              </button>

              <label className="px-3.5 py-2 rounded-2xl text-sm font-semibold border border-black/10 bg-white/85 text-neutral-800 transition-all duration-300 cursor-pointer hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
                Import
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={importItems}
                />
              </label>

              <label className="text-sm text-neutral-700 flex items-center gap-2">
                <span>Sort</span>
                <select
                  className={
                    "bg-white/90 px-3 py-2 rounded-xl outline-none border border-black/10 focus:ring-2 transition " +
                    ui.ring
                  }
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="dateAsc">Date (soonest)</option>
                  <option value="dateDesc">Date (latest)</option>
                  <option value="excitementDesc">Excitement (high)</option>
                  <option value="excitementAsc">Excitement (low)</option>
                </select>
              </label>

              <label className="text-sm text-neutral-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  className={"h-4 w-4 " + ui.accent}
                  checked={onlyNotDone}
                  onChange={(e) => setOnlyNotDone(e.target.checked)}
                />
                Only not done
              </label>
            </div>
          </div>

          <div className="grid gap-4">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className={
                  "rounded-3xl bg-white/80 backdrop-blur border border-black/10 p-5 shadow-lg " +
                  (removingIds[item.id]
                    ? "item-exit"
                    : lastAddedId === item.id
                      ? "item-appear"
                      : "") +
                  (item.status === "done" ? " item-done" : "") +
                  (lastDoneId === item.id ? " item-done-flash" : "")
                }
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <div className="text-sm text-neutral-600 mt-1">
                      {item.date ? item.date : "No date"} • {item.status}
                      {item.status === "done" && (
                        <span className="done-pill">Done</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {item.status === "planned" && (
                      <button
                        onClick={() => markDone(item.id)}
                        type="button"
                        className="px-3.5 py-1.5 rounded-2xl text-sm font-semibold border border-black/10 bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                      >
                        Done ✓
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      type="button"
                      className="px-3.5 py-1.5 rounded-2xl text-sm font-semibold border border-black/10 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-neutral-700">
                    <span>Excitement</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {displayExcitement(getItemExcitement(item))}
                      </span>
                      <span className="text-lg">
                        {excitementEmoji(getItemExcitement(item))}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500 transition-all"
                      style={{
                        width: `${getItemExcitement(item) * 10}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {visibleItems.length === 0 && (
              <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/10 p-10 text-neutral-600 text-center">
                Nothing here yet. Add your first one ✨
              </div>
            )}
          </div>
        </section>


        {/* Add form (collapsed by default) */}
        <div className="mt-6 mx-auto max-w-5xl rounded-3xl bg-white/80 backdrop-blur border border-black/10 p-5 shadow-lg">
          <button
            type="button"
            onClick={() => setIsAddOpen((v) => !v)}
            className={
              "w-full flex items-center justify-between gap-3 text-left " +
              "cursor-pointer rounded-2xl px-3 py-2 border border-black/10 " +
              "bg-white/70 hover:bg-white/90 transition-all duration-300 " +
              "hover:-translate-y-0.5 hover:shadow-lg"
            }
          >
            <div>
              <div className="text-sm text-neutral-600">Adding to</div>
              <div className="text-lg font-semibold">{selectedLabel}</div>
            </div>
            <span
              className={
                "text-2xl font-semibold leading-none transition-transform duration-300 " +
                (isAddOpen ? "rotate-45" : "")
              }
              aria-hidden="true"
            >
              +
            </span>
          </button>

          <div
            className={
              "overflow-hidden transition-all " +
              (isAddOpen ? "duration-300" : "duration-200") +
              " " +
              (isAddOpen
                ? "max-h-[1200px] opacity-100 mt-4"
                : "max-h-0 opacity-0 mt-0 pointer-events-none")
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={
                    "bg-white/90 p-3 rounded-2xl outline-none border border-black/10 focus:ring-2 transition " +
                    ui.ring
                  }
                  placeholder={`Add to ${selectedLabel}...`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addItem();
                  }}
                />

                <input
                  type="date"
                  className={
                    "bg-white/90 p-3 rounded-2xl outline-none border border-black/10 focus:ring-2 transition " +
                    ui.ring
                  }
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <div className="bg-white/90 p-3 rounded-2xl border border-black/10 md:col-span-2">
                  <div className="flex items-center justify-between text-sm text-neutral-700">
                    <span>Excitement</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {displayExcitement(formExcitement)}/10
                      </span>
                      <span className="text-lg">{excitementEmoji(formExcitement)}</span>
                    </span>
                  </div>
                  <input
                    className={"w-full range-gradient " + ui.accent}
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formExcitement}
                    style={{ "--pct": `${formExcitement * 10}%` }}
                    onChange={(e) =>
                      setForm({ ...form, excitement: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={addItem}
                  type="button"
                  className={
                    "px-5 py-2.5 rounded-2xl font-semibold border border-black/10 cursor-pointer " +
                    "bg-gradient-to-r from-pink-500 to-rose-500 text-white " +
                    "hover:from-pink-400 hover:to-rose-400 transition-all duration-300 shadow-lg shadow-rose-500/20 " +
                    "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/30"
                  }
                >
                  Add 💫
                </button>
              </div>
          </div>
        </div>

        <style>{`
          /* Make category palette changes feel smooth */
          .blob { will-change: transform, background-color; transition: background-color 1200ms ease; }
          .item-appear {
            animation: itemPop 420ms ease-out both;
          }
          .item-exit {
            animation: itemOut 260ms ease-in both;
          }
          .item-done {
            border-color: rgba(16, 185, 129, 0.45);
            background: rgba(236, 253, 245, 0.75);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.12);
            position: relative;
          }
          .item-done::after {
            content: "";
            position: absolute;
            inset: -1px;
            border-radius: 24px;
            border: 1px solid rgba(16, 185, 129, 0.25);
            pointer-events: none;
          }
          .item-done-flash {
            animation: doneFlash 420ms ease-out both;
          }
          @keyframes doneFlash {
            0% {
              box-shadow: 0 0 0 rgba(16, 185, 129, 0);
              transform: scale(1);
            }
            40% {
              box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25);
              transform: scale(1.01);
            }
            100% {
              box-shadow: 0 0 0 rgba(16, 185, 129, 0);
              transform: scale(1);
            }
          }
          .done-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-left: 8px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 600;
            color: #065f46;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.35);
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          @keyframes itemPop {
            0% { opacity: 0; transform: translateY(10px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes itemOut {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-6px) scale(0.98); }
          }
          .range-gradient {
            appearance: none;
            -webkit-appearance: none;
            background: transparent;
          }
          .range-gradient::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 999px;
            background-image:
              linear-gradient(90deg, #fb7185, #f59e0b, #22c55e),
              linear-gradient(90deg, #e5e7eb, #e5e7eb);
            background-size: var(--pct, 0%) 100%, 100% 100%;
            background-position: left, left;
            background-repeat: no-repeat;
          }
          .range-gradient::-moz-range-track {
            height: 8px;
            border-radius: 999px;
            background-image:
              linear-gradient(90deg, #fb7185, #f59e0b, #22c55e),
              linear-gradient(90deg, #e5e7eb, #e5e7eb);
            background-size: var(--pct, 0%) 100%, 100% 100%;
            background-position: left, left;
            background-repeat: no-repeat;
          }
          .range-gradient::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 999px;
            background: #111827;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            margin-top: -5px;
          }
          .range-gradient::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 999px;
            background: #111827;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }

          /* Circular-ish orbital paths that cover most of the viewport */
          @keyframes blobOrbit1 {
            0%   { transform: translate3d(0, -8vh, 0) scale(1); }
            25%  { transform: translate3d(18vw, 0, 0) scale(1.05); }
            50%  { transform: translate3d(0, 16vh, 0) scale(0.95); }
            75%  { transform: translate3d(-18vw, 0, 0) scale(1.05); }
            100% { transform: translate3d(0, -8vh, 0) scale(1); }
          }

          @keyframes blobOrbit2 {
            0%   { transform: translate3d(0, 12vh, 0) scale(1); }
            25%  { transform: translate3d(20vw, 0, 0) scale(1.06); }
            50%  { transform: translate3d(0, -18vh, 0) scale(0.96); }
            75%  { transform: translate3d(-20vw, 0, 0) scale(1.06); }
            100% { transform: translate3d(0, 12vh, 0) scale(1); }
          }

          @keyframes blobOrbit3 {
            0%   { transform: translate3d(-50%, 0, 0) scale(1); }
            25%  { transform: translate3d(-32%, -14vh, 0) scale(1.06); }
            50%  { transform: translate3d(-50%, 20vh, 0) scale(0.95); }
            75%  { transform: translate3d(-68%, -10vh, 0) scale(1.05); }
            100% { transform: translate3d(-50%, 0, 0) scale(1); }
          }

          /* Within-palette color drifting */
          @keyframes blobColor1 {
            0%   { background-color: rgb(var(--b1a)); }
            50%  { background-color: rgb(var(--b1b)); }
            100% { background-color: rgb(var(--b1a)); }
          }
          @keyframes blobColor2 {
            0%   { background-color: rgb(var(--b2a)); }
            50%  { background-color: rgb(var(--b2b)); }
            100% { background-color: rgb(var(--b2a)); }
          }
          @keyframes blobColor3 {
            0%   { background-color: rgb(var(--b3a)); }
            50%  { background-color: rgb(var(--b3b)); }
            100% { background-color: rgb(var(--b3a)); }
          }

          @media (prefers-reduced-motion: reduce) {
            .blob { animation: none !important; }
            .item-appear { animation: none !important; }
            .item-exit { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
