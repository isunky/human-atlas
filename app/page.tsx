import { flushSync } from "react-dom";
import {
  text,
  displayName,
  searchText,
  systemName,
  chineseExplanation,
  readLocale,
  errorText,
  LANGUAGE_STORAGE_KEY,
  type Locale,
} from "../client/i18n";
import { openExternal, runtimeInfo } from "../client/platform";
import { registerAtlasTools } from "./core/agent-tools";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Focus,
  Info,
  Layers3,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import AnatomyScene from "./scene";
import {
  DEFAULT_VISIBLE,
  SYSTEMS,
  EXPLANATIONS,
  explanation,
  type Atlas,
  type Concept,
  type SceneState,
  type SystemId,
  type View,
} from "./core/anatomy";
const initial: SceneState = {
  explode: 0,
  visible: DEFAULT_VISIBLE,
  selected: [],
  isolate: false,
  view: "three-quarter",
  rotate: false,
  reset: 0,
};
export default function Home() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return readLocale(window.localStorage);
    } catch {
      return "zh-CN";
    }
  });
  const [linkError, setLinkError] = useState(false);
  const t = (english: string, values: Record<string, string | number> = {}) =>
    text(english, locale, values);
  const dn = (english?: string) => (english ? displayName(english, locale) : "");
  const sn = (system: (typeof SYSTEMS)[number]) => systemName(system.id, system.name, locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    } catch {
      /* Browsing remains available if storage is disabled. */
    }
  }, [locale]);
  const externalClick = (event: React.MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement) || !runtimeInfo().native) return;
    event.preventDefault();
    setLinkError(false);
    void openExternal(anchor.href).catch(() => setLinkError(true));
  };
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const [atlas, setAtlas] = useState<Atlas | null>(null),
    [state, setState] = useState(initial),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [panel, setPanel] = useState<"layers" | "search" | null>(null),
    [details, setDetails] = useState(false),
    [about, setAbout] = useState(false),
    [query, setQuery] = useState(""),
    [chosen, setChosen] = useState<Concept | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setProgress(0);
    setError("");
    setAtlas(null);
    setChosen(null);
    setDetails(false);
    setState({ ...initial, visible: DEFAULT_VISIBLE });
    fetch("/models/atlas.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("The anatomy catalogue could not be loaded.");
        return r.json();
      })
      .then((data) => setAtlas(data as Atlas))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setPanel("search");
        setDetails(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const parts = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0]),
      ),
    [atlas],
  );
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);
  const selectedParts = state.selected.map((id) => parts.get(id)).filter((p) => !!p),
    selected = selectedParts[0],
    system = SYSTEMS.find((s) => s.id === selected?.system);
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : state.visible.includes(p.system) || state.selected.includes(p.id),
    ).length ?? 0;
  const results = useMemo(() => {
    if (!atlas) return [];
    const term = query.toLowerCase().trim();
    if (!term)
      return [
        "heart",
        "brain",
        "liver",
        "stomach",
        "spleen",
        "pancreas",
        "urinary bladder",
        "trachea",
      ]
        .map((name) => atlas.concepts.find((c) => c.name.toLowerCase() === name))
        .filter((x): x is Concept => !!x);
    return atlas.concepts
      .filter((c) => searchText(c.name, c.id).includes(term))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 80);
  }, [atlas, query]);
  const choose = (c: Concept) => {
    setChosen(c);
    setState((s) => ({ ...s, selected: c.elements, isolate: false, rotate: false }));
    setDetails(true);
    setPanel(null);
  };
  useEffect(() => {
    if (!atlas) return;
    return registerAtlasTools(atlas, (c) => flushSync(() => choose(c)));
  }, [atlas]);
  const choosePart = (id: string) => {
    const p = parts.get(id);
    if (!p) return;
    setChosen({ id: p.conceptId, name: p.name, elements: [id] });
    setState((s) => ({ ...s, selected: [id], isolate: false, rotate: false }));
    setDetails(true);
    setPanel(null);
  };
  const toggle = (id: SystemId) => {
    setDetails(false);
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }));
  };
  const reset = () => {
    setState((s) => ({ ...initial, visible: DEFAULT_VISIBLE, reset: s.reset + 1 }));
    setChosen(null);
    setDetails(false);
    setPanel(null);
  };
  const openPanel = (next: "layers" | "search") => {
    setDetails(false);
    setPanel((p) => (p === next ? null : next));
  };
  return (
    <main className="studio" onClick={externalClick}>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          locale={locale}
          state={{ ...state, inspectorOpen: details && selectedParts.length > 0 }}
          onSelect={choosePart}
          onProgress={(n) => {
            setProgress(n);
            if (n === 100) setError("");
          }}
          onError={setError}
        />
      )}
      <div className="vignette" />
      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> {t("INTERACTIVE ANATOMY")}
        </div>
        <h1>
          Human Atlas
          <Badge variant="outline" className="edition">
            3D
          </Badge>
        </h1>
        <div className="identity-meta">
          {atlas ? atlas.parts.length.toLocaleString() : "2,234"} {t("modeled pieces")}{" "}
          <span>·</span> BodyParts3D
        </div>
      </header>
      <div className="language-choice">
        <label htmlFor="atlas-language">{t("Language")}</label>
        <select
          id="atlas-language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
      {linkError && (
        <div className="link-status glass" role="status">
          {t("Could not open this link.")}
        </div>
      )}
      <nav className="top-actions" aria-label={t("Explorer panels")}>
        <Button
          variant="ghost"
          className={panel === "search" ? "active" : ""}
          onClick={() => openPanel("search")}
          aria-label={t("Search anatomy")}
        >
          <Search size={18} />
          <span>{t("Find a structure")}</span>
          <kbd>/</kbd>
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label={t("About this atlas")}
          onClick={() => {
            setDetails(false);
            setPanel(null);
            setAbout(true);
          }}
        >
          <Info size={18} />
        </Button>
      </nav>
      <section
        className={`layers-panel glass ${panel === "layers" ? "mobile-open" : ""}`}
        aria-label={t("Anatomical layers")}
      >
        <div className="panel-heading">
          <span>{t("Systems")}</span>
          <Button
            variant="ghost"
            className="mobile-only icon-button"
            onClick={() => setPanel(null)}
            aria-label={t("Close systems")}
          >
            <X size={18} />
          </Button>
          <Badge variant="secondary" className="desktop-only small-number">
            {activeSystems.length}
          </Badge>
        </div>
        <div className="layer-presets">
          <Button
            variant="ghost"
            aria-pressed={activeSystems.every((x) => state.visible.includes(x.id))}
            onClick={() =>
              setState((s) => ({
                ...s,
                selected: [],
                isolate: false,
                visible: activeSystems.map((x) => x.id),
              }))
            }
          >
            {t("All")}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={state.visible.length === 1 && state.visible[0] === "skeletal"}
            onClick={() =>
              setState((s) => ({ ...s, selected: [], isolate: false, visible: ["skeletal"] }))
            }
          >
            {t("Skeleton")}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={
              state.visible.length === 6 &&
              ["cardiac", "respiratory", "digestive", "urinary", "endocrine", "reproductive"].every(
                (id) => state.visible.includes(id as SystemId),
              )
            }
            onClick={() =>
              setState((s) => ({
                ...s,
                selected: [],
                isolate: false,
                visible: [
                  "cardiac",
                  "respiratory",
                  "digestive",
                  "urinary",
                  "endocrine",
                  "reproductive",
                ],
              }))
            }
          >
            {t("Organs")}
          </Button>
        </div>
        <div className="system-list">
          {activeSystems.map((s) => (
            <div
              className={`system-row ${state.visible.includes(s.id) ? "enabled" : ""}`}
              key={s.id}
            >
              <Button
                variant="ghost"
                className="system-name"
                title={t("Show only {name}", { name: sn(s) })}
                onClick={() =>
                  setState((v) => ({ ...v, visible: [s.id], isolate: false, selected: [] }))
                }
              >
                <span className="system-dot" style={{ background: s.color }} />
                {sn(s)}
                <span className="system-count">{counts[s.id]}</span>
              </Button>
              <Switch
                checked={state.visible.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
                aria-label={t("Show {name}", { name: sn(s) })}
              />
            </div>
          ))}
        </div>
        <div className="panel-foot">
          <span>{t("{count} pieces visible", { count: visibleCount.toLocaleString() })}</span>
          <Button
            variant="ghost"
            onClick={() => setState((s) => ({ ...s, visible: [], selected: [], isolate: false }))}
          >
            {t("Hide all")}
          </Button>
        </div>
      </section>
      {panel === "search" && (
        <section className="search-panel glass" aria-label={t("Find a structure")}>
          <div className="panel-heading">
            <span>{t("Find a structure")}</span>
            <Button
              variant="ghost"
              className="icon-button"
              onClick={() => setPanel(null)}
              aria-label={t("Close search")}
            >
              <X size={18} />
            </Button>
          </div>
          <Combobox<Concept>
            items={results}
            value={null}
            onValueChange={(value) => {
              if (value) choose(value);
            }}
            inputValue={query}
            onInputValueChange={setQuery}
            itemToStringLabel={(c) => dn(c.name)}
            filter={null}
            open
            onOpenChange={(open) => {
              if (!open) setPanel(null);
            }}
          >
            <ComboboxInput
              autoFocus
              placeholder={t("Heart, femur, cranial nerve…")}
              aria-label={t("Search named anatomical structures")}
              showTrigger={false}
            />
            <ComboboxContent className="anatomy-search-results">
              <ComboboxEmpty>{t("No structures match your search.")}</ComboboxEmpty>
              <ComboboxList>
                {(c: Concept) => (
                  <ComboboxItem key={c.id} value={c}>
                    <span className="search-result-name">
                      {dn(c.name)}
                      {locale === "zh-CN" && <small>{c.name}</small>}
                    </span>
                    <span className="small-number">
                      {c.elements.length} {c.elements.length === 1 ? t("piece") : t("pieces")}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <p className="search-note">
            {query
              ? t("Showing up to 80 matches. Refine your search to find smaller structures.")
              : t("Start with a major organ, or search every named structure.")}
          </p>
        </section>
      )}
      <nav className="view-controls glass" aria-label={t("Camera controls")}>
        {(["three-quarter", "front", "side", "back"] as View[]).map((v, i) => (
          <Button
            variant="ghost"
            key={v}
            className={state.view === v ? "active" : ""}
            aria-pressed={state.view === v}
            disabled={state.explode > 0.8 && v !== "front"}
            onClick={() => setState((s) => ({ ...s, view: v, reset: s.reset + 1, rotate: false }))}
            title={t(`${v} view`)}
            aria-label={t(`${v} view`)}
          >
            <span>{(locale === "zh-CN" ? ["¾", "正", "侧", "背"] : ["¾", "F", "S", "B"])[i]}</span>
          </Button>
        ))}
        <i />
        <Button
          variant="ghost"
          disabled={state.explode >= 0.4}
          aria-label={state.rotate ? t("Pause rotation") : t("Rotate body")}
          title={t("Auto rotate")}
          className={state.rotate ? "active" : ""}
          onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
        >
          {state.rotate ? <Pause size={17} /> : <RotateCw size={18} />}
        </Button>
        <Button
          variant="ghost"
          aria-label={t("Reset view and layers")}
          title={t("Reset")}
          onClick={reset}
        >
          <RotateCcw size={17} />
        </Button>
      </nav>
      <div className="scene-caption">
        <span className="caption-line" />
        <span>
          {state.isolate
            ? dn(chosen?.name) || t("SELECTED STRUCTURE")
            : state.explode > 0.95
              ? t("ANATOMICAL INVENTORY")
              : state.explode > 0.05
                ? t("SEPARATED STRUCTURES")
                : t("ADULT HUMAN · MALE")}
        </span>
        <span className="caption-line" />
      </div>
      <div className="bottom-dock glass">
        <Button
          variant="ghost"
          className="mobile-only dock-layers"
          onClick={() => openPanel("layers")}
          aria-label={t("Open system layers")}
        >
          <Layers3 size={20} />
          <span>{t("Systems")}</span>
        </Button>
        <div className="explode-control">
          <div className="explode-label">
            <label id="explode-label">{t("Explode anatomy")}</label>
            <output>
              {Math.round(state.explode * 100)}
              <span>%</span>
            </output>
          </div>
          <Slider
            aria-labelledby="explode-label"
            min={0}
            max={100}
            step={1}
            value={[state.explode * 100]}
            onValueChange={(v) =>
              setState((s) => ({
                ...s,
                explode: (Array.isArray(v) ? v[0] : v) / 100,
                view: (Array.isArray(v) ? v[0] : v) > 80 ? "front" : s.view,
                rotate: false,
              }))
            }
          />
          <div className="slider-endpoints">
            <span>{t("Assembled")}</span>
            <span>{t("Every piece")}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="dock-reset"
          onClick={reset}
          aria-label={t("Assemble and reset")}
        >
          <RotateCcw size={18} />
          <span>{t("Reset")}</span>
        </Button>
      </div>
      <footer className="studio-footer">
        <span>
          {state.explode > 0.8 ? t("Drag to pan") : t("Drag to orbit")} <b>·</b>{" "}
          {t("Pinch to zoom")} <b>·</b> {t("Tap to inspect")}
        </span>
        <Button
          variant="ghost"
          onClick={() => {
            setDetails(false);
            setPanel(null);
            setAbout(true);
          }}
        >
          {t("Source & credits")} <ArrowUpRight size={12} />
        </Button>
      </footer>
      {progress < 100 && !error && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>{t("Preparing the anatomy")}</strong>
            <span>
              {progress}% ·{" "}
              {t("Loading {count} pieces", {
                count: atlas?.parts.length.toLocaleString() ?? "2,234",
              })}
            </span>
            <div className="loading-track">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="loading glass error" role="alert">
          <p>{errorText(error, locale)}</p>
          <Button variant="ghost" onClick={() => location.reload()}>
            {t("Reload viewer")}
          </Button>
        </div>
      )}
      <Sheet
        open={details && selectedParts.length > 0}
        modal={false}
        disablePointerDismissal
        onOpenChange={setDetails}
      >
        <SheetContent
          closeLabel={t("Close")}
          initialFocus={detailTitle}
          className={`detail-sheet glass ${state.isolate ? "is-isolated" : ""}`}
          showCloseButton={true}
        >
          <div className="detail-header">
            <div className="detail-accent" style={{ background: system?.color }} />
            <div className="eyebrow">{system ? sn(system) : t("ANATOMY")}</div>
            <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">
              {dn(chosen?.name)}
            </SheetTitle>
            {locale === "zh-CN" && chosen && <p className="source-name">{chosen.name}</p>}
          </div>
          <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}>
            <SheetDescription className="structure-description">
              {chosen && selected
                ? locale === "zh-CN"
                  ? chineseExplanation(chosen.name, selected.system)
                  : explanation(chosen.name, selected.system)
                : ""}
            </SheetDescription>
            {chosen && !EXPLANATIONS[chosen.name.toLowerCase()] && (
              <span className="context-note">
                {t("System overview · structure identified from source anatomy")}
              </span>
            )}
            <div className="structure-meta">
              <span>
                {t("Atlas reference")}
                <strong>{chosen?.id}</strong>
              </span>
              <span>
                {t("Selected pieces")}
                <strong>{state.selected.length.toLocaleString()}</strong>
              </span>
            </div>
            {selectedParts.length > 1 && (
              <div className="member-list">
                <h3>{t("Included structures")}</h3>
                {selectedParts.slice(0, 50).map((p) => (
                  <Button variant="ghost" key={p.id} onClick={() => choosePart(p.id)}>
                    <span>{dn(p.name)}</span>
                    <ChevronRight size={14} />
                  </Button>
                ))}
                {selectedParts.length > 50 && (
                  <p>
                    {t("And {count} more modeled pieces.", { count: selectedParts.length - 50 })}
                  </p>
                )}
              </div>
            )}
            <a
              className="source-link"
              href="https://lifesciencedb.jp/bp3d/"
              target="_blank"
              rel="noreferrer"
            >
              {t("View anatomical source")} <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="detail-actions">
            <Button
              className={`primary-action ${state.isolate ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, isolate: !s.isolate, explode: 0 }))}
            >
              <Focus size={18} />
              {state.isolate ? t("Show surrounding anatomy") : t("Isolate structure")}
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                setState((s) => ({ ...s, selected: [], isolate: false }));
                setDetails(false);
              }}
            >
              {t("Clear selection")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent closeLabel={t("Close")} className="about-sheet glass">
          <div className="eyebrow">{t("SOURCE & SCOPE")}</div>
          <SheetTitle className="structure-title">{t("A body, revealed.")}</SheetTitle>
          <SheetDescription>
            {t("Explore the adult male reference anatomy from BodyParts3D.")}
          </SheetDescription>
          <div className="about-copy">
            <p className="client-edition">
              {t(runtimeInfo().native ? "Offline client" : "Web viewer")} · {runtimeInfo().version}
            </p>
            <h3>{t("Chinese terminology draft")}</h3>
            <p>
              {t(
                "Chinese names are an offline terminology draft and have not been professionally reviewed. English source names and identifiers are preserved for comparison.",
              )}
            </p>
            <p>
              <strong>{t("Male · BodyParts3D")}</strong>
              <br />
              {t(
                "2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.",
              )}
            </p>
            <p>
              {t(
                "This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.",
              )}
            </p>
            <p>
              {t(
                "Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.",
              )}
            </p>
            <h3>{t("Source")}</h3>
            <p>
              {t(
                "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.",
              )}
            </p>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
              target="_blank"
              rel="noreferrer"
            >
              {t("Dataset license")} <ArrowUpRight size={14} />
            </a>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"
              target="_blank"
              rel="noreferrer"
            >
              {t("Original geometry & metadata")} <ArrowUpRight size={14} />
            </a>
            <a
              href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752"
              target="_blank"
              rel="noreferrer"
            >
              {t("Read the source publication")} <ArrowUpRight size={14} />
            </a>
            <p>{t("Application code: MIT. Anatomy data: CC BY 4.0.")}</p>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
