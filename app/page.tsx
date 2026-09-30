import { flushSync } from "react-dom";
import {
  READING_GUIDE,
  DIRECTION_TERMS,
  CONTENT_REFERENCES,
  chineseStructureKnowledge,
} from "../client/content/zh-CN";
import {
  text,
  displayName,
  systemName,
  chineseExplanation,
  hasChineseExplanation,
  readLocale,
  errorText,
  LANGUAGE_STORAGE_KEY,
  type Locale,
} from "../client/i18n";
import { openExternal, runtimeInfo } from "../client/platform";
import { registerAtlasTools } from "./core/agent-tools";
import { anatomySearchIndex, matchedSearchAlias, type SearchEntry } from "./core/anatomy-search";
import { InputGroupButton } from "@/components/ui/input-group";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ArrowLeft,
  ChevronDown,
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
const ORGAN_SYSTEMS: SystemId[] = [
  "cardiac",
  "respiratory",
  "digestive",
  "urinary",
  "endocrine",
  "reproductive",
];
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
  const [detailCompact, setDetailCompact] = useState(false);
  const [detailWide, setDetailWide] = useState(false);
  const [detailElement, setDetailElement] = useState<HTMLDivElement | null>(null);
  const [detailLayout, setDetailLayout] = useState("");
  useEffect(() => {
    if (!detailElement) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDetailLayout(`${Math.round(width)}:${Math.round(height)}`);
    });
    observer.observe(detailElement);
    return () => observer.disconnect();
  }, [detailElement]);
  const searchInput = useRef<HTMLInputElement>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
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
  const searchIndex = useMemo(
    () => (atlas ? anatomySearchIndex(atlas) : new Map<string, SearchEntry>()),
    [atlas],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0]),
      ),
    [atlas],
  );
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);
  const matchesLayers = (ids: SystemId[]) =>
    !state.isolate &&
    state.visible.length === ids.length &&
    ids.every((id) => state.visible.includes(id));
  const allLayers = matchesLayers(activeSystems.map((s) => s.id));
  const skeletonLayers = matchesLayers(["skeletal"]);
  const organLayers = matchesLayers(ORGAN_SYSTEMS);
  const singleSystem = activeSystems.find((s) => matchesLayers([s.id]));
  const layerStatus = state.isolate
    ? t("Isolated selection")
    : !state.visible.length
      ? t("All hidden")
      : allLayers
        ? t("All")
        : skeletonLayers
          ? t("Skeleton")
          : organLayers
            ? t("Organs")
            : matchesLayers(DEFAULT_VISIBLE)
              ? t("Default layers")
              : singleSystem
                ? t("Only {name}", { name: sn(singleSystem) })
                : t("Custom layers");
  const applyLayers = (visible: SystemId[]) => {
    setDetails(false);
    setChosen(null);
    setState((s) => ({ ...s, visible, selected: [], isolate: false, focus: 0 }));
  };
  const selectedParts = state.selected.map((id) => parts.get(id)).filter((p) => !!p),
    selected = selectedParts[0],
    system = SYSTEMS.find((s) => s.id === selected?.system);
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : state.visible.includes(p.system) || state.selected.includes(p.id),
    ).length ?? 0;
  const searchResults = useMemo(() => {
    if (!atlas) return { items: [] as Concept[], total: 0 };
    const term = query.toLowerCase().trim();
    if (!term) {
      const popular = [
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
      const recent = recentIds.flatMap((id) => searchIndex.get(id)?.concept ?? []);
      return { items: [...recent, ...popular.filter((c) => !recentIds.includes(c.id))], total: 0 };
    }
    const matches = atlas.concepts
      .filter((c) => searchIndex.get(c.id)?.searchable.includes(term))
      .sort((a, b) => a.name.length - b.name.length);
    return { items: matches.slice(0, 80), total: matches.length };
  }, [atlas, query, recentIds, searchIndex]);
  const results = searchResults.items;
  const remember = (id: string) =>
    setRecentIds((ids) => [id, ...ids.filter((existing) => existing !== id)].slice(0, 6));
  const choose = (c: Concept) => {
    setDetailCompact(false);
    remember(c.id);
    setChosen(c);
    setState((s) => ({ ...s, selected: c.elements, isolate: false, rotate: false, focus: 0 }));
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
    setDetailCompact(false);
    remember(p.conceptId);
    setChosen({ id: p.conceptId, name: p.name, elements: [id] });
    setState((s) => ({ ...s, selected: [id], isolate: false, rotate: false, focus: 0 }));
    setDetails(true);
    setPanel(null);
  };
  const toggle = (id: SystemId) => {
    setDetails(false);
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      focus: 0,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }));
  };
  const reset = () => {
    setState((s) => ({ ...initial, visible: DEFAULT_VISIBLE, reset: s.reset + 1 }));
    setChosen(null);
    setDetails(false);
    setPanel(null);
  };
  const resetView = () => {
    setState((s) => ({
      ...s,
      view: s.explode > 0.8 ? "front" : initial.view,
      rotate: false,
      focus: 0,
      reset: s.reset + 1,
    }));
  };
  const openPanel = (next: "layers" | "search") => {
    setDetails(false);
    setPanel((p) => (p === next ? null : next));
  };
  const returnToOverview = () => {
    setChosen(null);
    setDetails(false);
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      focus: 0,
      rotate: false,
      view: s.explode > 0.8 ? "front" : initial.view,
      reset: s.reset + 1,
    }));
  };
  return (
    <main className="studio" onClick={externalClick}>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          locale={locale}
          state={{
            ...state,
            inspectorOpen: details && selectedParts.length > 0,
            inspectorLayout: detailLayout,
          }}
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
          <Badge
            variant="secondary"
            className="desktop-only small-number"
            title={t("{count} systems available", { count: activeSystems.length })}
          >
            {activeSystems.length}
          </Badge>
        </div>
        <div className="layer-presets">
          <Button
            variant="ghost"
            aria-pressed={allLayers}
            onClick={() => applyLayers(activeSystems.map((s) => s.id))}
          >
            {t("All")}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={skeletonLayers}
            onClick={() => applyLayers(["skeletal"])}
          >
            {t("Skeleton")}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={organLayers}
            onClick={() => applyLayers(ORGAN_SYSTEMS)}
          >
            {t("Organs")}
          </Button>
        </div>
        <div className="layer-context">
          <p className="layer-status" role="status">
            <span>{t("Current layers")}</span>
            <strong>{layerStatus}</strong>
          </p>
          <p id="layer-help" className="layer-help">
            {t("Switches show or hide; Only shows one system.")}
          </p>
          {selectedParts.some((p) => !state.visible.includes(p.system)) && !state.isolate && (
            <p className="layer-help">{t("Selected structures remain visible.")}</p>
          )}
        </div>
        <div className="system-list" aria-describedby="layer-help">
          {activeSystems.map((s) => (
            <div
              className={`system-row ${state.visible.includes(s.id) ? "enabled" : ""}`}
              key={s.id}
            >
              <div className="system-name" title={sn(s)}>
                <span className="system-dot" style={{ background: s.color }} />
                <span className="system-label">{sn(s)}</span>
                <span className="system-count" title={t("{count} pieces", { count: counts[s.id] })}>
                  {counts[s.id]}
                </span>
              </div>
              <Button
                variant="ghost"
                className="system-only"
                title={t("Show only {name}", { name: sn(s) })}
                aria-label={t("Show only {name}", { name: sn(s) })}
                aria-pressed={matchesLayers([s.id])}
                onClick={() => applyLayers([s.id])}
              >
                {t("Only")}
              </Button>
              <Switch
                checked={state.visible.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
                aria-label={t("Show {name}", { name: sn(s) })}
                title={
                  state.visible.includes(s.id)
                    ? t("Hide {name}", { name: sn(s) })
                    : t("Show {name}", { name: sn(s) })
                }
              />
            </div>
          ))}
        </div>
        <div className="panel-foot">
          <span>{t("{count} pieces visible", { count: visibleCount.toLocaleString() })}</span>
          <Button variant="ghost" onClick={() => applyLayers([])}>
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
            inline
            value={null}
            onValueChange={(value) => {
              if (value) choose(value);
            }}
            inputValue={query}
            onInputValueChange={setQuery}
            itemToStringLabel={(c) => dn(c.name)}
            filter={null}
          >
            <ComboboxInput
              ref={searchInput}
              autoFocus
              placeholder={t("Heart, femur, cranial nerve…")}
              aria-label={t("Search named anatomical structures")}
              showTrigger={false}
              aria-describedby="search-help"
              onKeyDown={(event) => {
                if (event.key === "Escape") setPanel(null);
              }}
              endAdornment={
                query && (
                  <InputGroupButton
                    className="search-clear"
                    variant="ghost"
                    aria-label={t("Clear search")}
                    title={t("Clear search")}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery("");
                      searchInput.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </InputGroupButton>
                )
              }
            />
            <p id="search-help" className="search-help">
              {t("Select a result to highlight it and open details.")}
              <br />
              {t("Left and right refer to the body's own sides.")}
            </p>
            <div className="search-result-summary">
              <span role="status">
                {query.trim()
                  ? t("{count} matches", { count: searchResults.total })
                  : recentIds.length
                    ? t("Recent & common structures")
                    : t("Common structures")}
              </span>
              {!query.trim() && recentIds.length > 0 && (
                <Button variant="ghost" onClick={() => setRecentIds([])}>
                  {t("Clear recent")}
                </Button>
              )}
            </div>
            <div className="anatomy-search-results search-inline">
              <ComboboxEmpty className="search-empty block p-0">
                {t("No structures match your search.")}
              </ComboboxEmpty>
              <ComboboxList className="search-list" aria-label={t("Anatomical search results")}>
                {(c: Concept) => {
                  const entry = searchIndex.get(c.id);
                  const alias = entry && matchedSearchAlias(entry, query);
                  const side = entry?.side;
                  return (
                    <ComboboxItem key={c.id} value={c} className="search-result">
                      <span className="search-result-body">
                        <span className="search-result-title">
                          <span className="search-result-name">{dn(c.name)}</span>
                          {side && (
                            <span className="search-side">
                              {side === "both"
                                ? t("Left & right")
                                : side === "left"
                                  ? t("Left side")
                                  : t("Right side")}
                            </span>
                          )}
                        </span>
                        {locale === "zh-CN" && <span className="search-source-name">{c.name}</span>}
                        <span className="search-result-context">
                          <span>{t("Included systems")}</span>
                          {entry?.systems.map((id) => {
                            const system = SYSTEMS.find((s) => s.id === id)!;
                            return (
                              <span className="search-system" key={id}>
                                <span className="system-dot" style={{ background: system.color }} />
                                {sn(system)}
                              </span>
                            );
                          })}
                          <span>{t("{count} pieces", { count: c.elements.length })}</span>
                          {!query.trim() && recentIds.includes(c.id) && (
                            <span className="search-recent">{t("Recent")}</span>
                          )}
                        </span>
                        {alias && (
                          <span className="search-alias">
                            {t("Matched alias: {alias}", { alias })}
                          </span>
                        )}
                        <span className="search-source-id">
                          {t("Atlas reference")}: {c.id}
                        </span>
                      </span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </div>
          </Combobox>
          <p className="search-note">
            {query
              ? searchResults.total > 80
                ? t("Showing up to 80 matches. Refine your search to find smaller structures.")
                : t("Search by Chinese or English name, alias or source ID.")
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
            onClick={() =>
              setState((s) => ({ ...s, view: v, reset: s.reset + 1, rotate: false, focus: 0 }))
            }
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
          className="view-reset"
          aria-label={t("Reset view")}
          title={t("Reset view; keep layers, selection and separation")}
          onClick={resetView}
        >
          <RotateCcw size={17} />
          <span>{t("Reset view")}</span>
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
      {selectedParts.length > 0 && !details && !panel && !about && (
        <div
          className="selection-summary glass"
          role="group"
          aria-label={t("Selected structure actions")}
        >
          <Button
            variant="ghost"
            className="selection-open"
            onClick={() => {
              setDetailCompact(false);
              setDetails(true);
            }}
          >
            <Info size={16} />
            <span>
              {dn(chosen?.name)}
              <small>{t("View details")}</small>
            </span>
          </Button>
          <Button variant="ghost" onClick={returnToOverview}>
            <ArrowLeft size={15} />
            {t("Back to overview")}
          </Button>
        </div>
      )}
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
                focus: 0,
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
          aria-label={t("Reset all")}
          title={t("Restore default layers, clear selection and assemble anatomy")}
        >
          <RotateCcw size={18} />
          <span>{t("Reset all")}</span>
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
          ref={setDetailElement}
          closeLabel={t("Close details")}
          initialFocus={detailTitle}
          className={`detail-sheet glass ${state.isolate ? "is-isolated" : ""} ${detailCompact ? "is-compact" : ""} ${detailWide ? "is-wide" : ""}`}
          showCloseButton={true}
        >
          <div className="detail-header">
            <div className="detail-accent" style={{ background: system?.color }} />
            <div className="eyebrow">{system ? sn(system) : t("ANATOMY")}</div>
            <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">
              {dn(chosen?.name)}
            </SheetTitle>
            {locale === "zh-CN" && chosen && <p className="source-name">{chosen.name}</p>}
            <div className="detail-display-controls">
              <Button
                variant="ghost"
                onClick={() => setDetailCompact((compact) => !compact)}
                aria-expanded={!detailCompact}
                aria-controls="structure-detail-content"
              >
                <ChevronDown size={14} className={detailCompact ? "" : "expanded"} />
                {detailCompact ? t("Expand details") : t("Collapse details")}
              </Button>
              {!detailCompact && (
                <Button
                  variant="ghost"
                  className="detail-width-control"
                  aria-pressed={detailWide}
                  onClick={() => setDetailWide((wide) => !wide)}
                >
                  {detailWide ? t("Compact width") : t("Wider reading")}
                </Button>
              )}
            </div>
          </div>
          <div
            id="structure-detail-content"
            hidden={detailCompact}
            className="detail-scroll"
            key={chosen?.id}
          >
            <SheetDescription className="structure-description">
              {chosen && selected
                ? locale === "zh-CN"
                  ? chineseExplanation(chosen.name, selected.system)
                  : explanation(chosen.name, selected.system)
                : ""}
            </SheetDescription>
            {chosen &&
              !(locale === "zh-CN"
                ? hasChineseExplanation(chosen.name)
                : EXPLANATIONS[chosen.name.toLowerCase()]) && (
                <span className="context-note">
                  {t("System overview · structure identified from source anatomy")}
                </span>
              )}
            {locale === "zh-CN" && chosen && chineseStructureKnowledge(chosen.name) && (
              <section className="learning-note" aria-label="观察提示">
                <h3>观察提示</h3>
                <p>{chineseStructureKnowledge(chosen.name)!.observe}</p>
              </section>
            )}
            <details className="detail-reference">
              <summary>{t("Reference & included pieces")}</summary>
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
            </details>
          </div>
          <div className="detail-actions">
            <Button
              className="primary-action locate-action"
              disabled={progress < 100 || !!error}
              title={t("Center the camera on the selection; keep surrounding layers")}
              onClick={() => setState((s) => ({ ...s, focus: (s.focus ?? 0) + 1, rotate: false }))}
            >
              <Focus size={18} />
              {t("Locate structure")}
            </Button>
            <Button
              variant="outline"
              className={`isolate-action ${state.isolate ? "active" : ""}`}
              title={t(
                "Isolate hides other structures; surrounding anatomy restores the current layers",
              )}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  isolate: !s.isolate,
                  explode: 0,
                  focus: 0,
                  rotate: false,
                }))
              }
            >
              <Focus size={18} />
              {state.isolate ? t("Show surrounding anatomy") : t("Isolate structure")}
            </Button>
            <Button
              variant="ghost"
              className="secondary-action"
              title={t("Clear selection and restore the overview; keep layers and separation")}
              onClick={returnToOverview}
            >
              <ArrowLeft size={15} />
              {t("Back to overview")}
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
            {locale === "zh-CN" && (
              <section className="reading-guide" aria-label="中文阅读指南">
                <h3>中文阅读指南</h3>
                {READING_GUIDE.map((item) => (
                  <details key={item.title}>
                    <summary>{item.title}</summary>
                    <p>{item.body}</p>
                  </details>
                ))}
                <details>
                  <summary>常用解剖方位词</summary>
                  <p>
                    以下方位以标准解剖姿势为参照：身体直立、面向前方，手掌朝前。模型的姿势和相机角度可能与这一参照不同。
                  </p>
                  <dl>
                    {DIRECTION_TERMS.map(([term, description]) => (
                      <div key={term}>
                        <dt>{term}</dt>
                        <dd>{description}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
                <details>
                  <summary>内容参考</summary>
                  <p>
                    中文学习说明为自行编写的简要内容，解剖事实参考 OpenStax
                    教材，可联网查看以下页面。
                  </p>
                  {CONTENT_REFERENCES.map((reference) => (
                    <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">
                      {reference.title} <ArrowUpRight size={14} />
                    </a>
                  ))}
                </details>
              </section>
            )}
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
