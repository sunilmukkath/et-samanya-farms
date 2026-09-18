"use client";

import {
  createTreeAction,
  getTreeDetailAction,
  saveBoundaryAction,
  suggestTreeVisionAction,
} from "@/app/admin/actions";
import { GpsBadge, useGps } from "@/components/admin/GpsBadge";
import type { AiSuggestion, GeoPolygon, TreeHealth, ZoneRow } from "@/db/schema";
import {
  DUPLICATE_TREE_METERS,
  farmCoords,
  habitOptions,
  healthOptions,
  treeAgeLabel,
  treeCensusTarget,
  zoneLabels,
} from "@/lib/farm";
import { haversineMeters, nearestPoints } from "@/lib/geo";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

export type TreePin = {
  id: string;
  lat: number;
  lng: number;
  accuracyM: number | null;
  species: string;
  plantingYear: number | null;
  plantedOn: string | null;
  health: TreeHealth;
  habit: "sapling" | "young" | "mature" | null;
  photoUrl: string | null;
  note: string | null;
  zone: string | null;
};

export type PlotPin = {
  id: string;
  name: string;
  kind: string;
  polygon: GeoPolygon | null;
};

export type HealthEvent = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

const HEALTH_COLOR: Record<TreeHealth, string> = {
  healthy: "#7eb13a",
  watch: "#c4a035",
  stressed: "#c45c32",
  dead: "#6a7360",
};

const YEARS = [2023, 2024, 2025, 2026];

export function FarmMap({
  trees,
  species,
  zones,
  plots = [],
  healthEvents = [],
  droneTileUrl = null,
  visionEnabled,
}: {
  trees: TreePin[];
  species: { name: string; tamil: string | null }[];
  zones: Pick<ZoneRow, "name" | "polygon">[];
  plots?: PlotPin[];
  healthEvents?: HealthEvent[];
  droneTileUrl?: string | null;
  visionEnabled: boolean;
}) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const youRef = useRef<Marker | null>(null);
  const draftRef = useRef<Marker | null>(null);
  const { fix, error } = useGps();
  const [healthFilter, setHealthFilter] = useState<TreeHealth | "all">("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTreeDetailAction>>>(null);
  const [boundaryOn, setBoundaryOn] = useState(false);
  const [boundaryPts, setBoundaryPts] = useState<{ lat: number; lng: number }[]>([]);
  const [showPlots, setShowPlots] = useState(true);
  const [showHealth, setShowHealth] = useState(false);
  const [showDrone, setShowDrone] = useState(Boolean(droneTileUrl));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pending, start] = useTransition();
  const droneTiles = droneTileUrl;

  const filtered = useMemo(
    () =>
      trees.filter((tree) => {
        if (healthFilter !== "all" && tree.health !== healthFilter) return false;
        if (speciesFilter !== "all" && tree.species !== speciesFilter) return false;
        if (yearFilter !== "all" && String(tree.plantingYear) !== yearFilter) return false;
        return true;
      }),
    [trees, healthFilter, speciesFilter, yearFilter],
  );

  const watchCount = trees.filter((tree) => tree.health === "watch" || tree.health === "stressed").length;

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: container.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          sat: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Tiles © Esri",
          },
        },
        layers: [{ id: "sat", type: "raster", source: "sat" }],
      },
      center: [farmCoords.lng, farmCoords.lat],
      zoom: 17.2,
      maxZoom: 20,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("trees", {
        type: "geojson",
        data: emptyFc(),
        cluster: true,
        clusterRadius: 34,
        clusterMaxZoom: 19,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "trees",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#142414",
          "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 30, 26],
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "trees",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: { "text-color": "#e8efd4" },
      });
      map.addLayer({
        id: "tree-dots",
        type: "circle",
        source: "trees",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f7f4ea",
          "circle-color": [
            "match",
            ["get", "health"],
            "watch",
            HEALTH_COLOR.watch,
            "stressed",
            HEALTH_COLOR.stressed,
            "dead",
            HEALTH_COLOR.dead,
            HEALTH_COLOR.healthy,
          ],
        },
      });
      map.addSource("boundary", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "boundary-fill",
        type: "fill",
        source: "boundary",
        paint: { "fill-color": "#9ccc4a", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "boundary-line",
        type: "line",
        source: "boundary",
        paint: { "line-color": "#e8efd4", "line-width": 2, "line-dasharray": [2, 1] },
      });
      map.addSource("plots", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "plots-fill",
        type: "fill",
        source: "plots",
        paint: { "fill-color": "#c4a035", "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: "plots-line",
        type: "line",
        source: "plots",
        paint: { "line-color": "#f2c14e", "line-width": 2 },
      });
      map.addSource("health", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "health-dots",
        type: "circle",
        source: "health",
        paint: {
          "circle-radius": 8,
          "circle-color": "#c45c32",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f7f4ea",
        },
      });
      if (droneTiles) {
        map.addSource("drone", {
          type: "raster",
          tiles: [droneTiles],
          tileSize: 256,
        });
        map.addLayer(
          {
            id: "drone",
            type: "raster",
            source: "drone",
            layout: { visibility: "visible" },
            paint: { "raster-opacity": 0.85 },
          },
          "boundary-fill",
        );
      }
    });
    map.on("click", "tree-dots", (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id as string | undefined;
      if (id) setSelectedId(id);
    });
    map.on("click", "clusters", (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const source = map.getSource("trees") as GeoJSONSource;
      const clusterId = feature?.properties?.cluster_id as number | undefined;
      if (clusterId == null || !feature) return;
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const geometry = feature.geometry as unknown as { coordinates: [number, number] };
        map.easeTo({ center: geometry.coordinates, zoom });
      });
    });
    map.on("mouseenter", "tree-dots", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "tree-dots", () => {
      map.getCanvas().style.cursor = "";
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Created once on mount; drone tiles are read at boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("trees")) return;
    const source = map.getSource("trees") as GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features: filtered.map((tree) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [tree.lng, tree.lat] },
        properties: { id: tree.id, health: tree.health, species: tree.species },
      })),
    });
  }, [filtered]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("boundary")) return;
    const saved = zones.find((zone) => zone.name === "Farm boundary" && zone.polygon);
    const source = map.getSource("boundary") as GeoJSONSource;
    if (boundaryPts.length >= 2) {
      const ring = [...boundaryPts, boundaryPts[0]];
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [ring.map((p) => [p.lng, p.lat])] },
            properties: {},
          },
        ],
      });
      return;
    }
    if (saved?.polygon) {
      source.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: saved.polygon, properties: {} }],
      });
    } else {
      source.setData(emptyFc());
    }
  }, [zones, boundaryPts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("plots")) return;
    const source = map.getSource("plots") as GeoJSONSource;
    if (!showPlots) {
      source.setData(emptyFc());
      return;
    }
    source.setData({
      type: "FeatureCollection",
      features: plots
        .filter((plot) => plot.polygon)
        .map((plot) => ({
          type: "Feature" as const,
          geometry: plot.polygon as GeoPolygon,
          properties: { id: plot.id, name: plot.name, kind: plot.kind },
        })),
    });
  }, [plots, showPlots]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("health")) return;
    const source = map.getSource("health") as GeoJSONSource;
    if (!showHealth) {
      source.setData(emptyFc());
      return;
    }
    source.setData({
      type: "FeatureCollection",
      features: healthEvents.map((event) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [event.lng, event.lat] },
        properties: { id: event.id, label: event.label },
      })),
    });
  }, [healthEvents, showHealth]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("drone")) return;
    map.setLayoutProperty("drone", "visibility", showDrone ? "visible" : "none");
  }, [showDrone]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fix) return;
    if (!youRef.current) {
      const el = document.createElement("div");
      el.className = "h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-400 shadow";
      youRef.current = new Marker({ element: el }).setLngLat([fix.lng, fix.lat]).addTo(map);
    } else {
      youRef.current.setLngLat([fix.lng, fix.lat]);
    }
  }, [fix]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!adding || !draft) {
      draftRef.current?.remove();
      draftRef.current = null;
      return;
    }
    if (!draftRef.current) {
      const marker = new Marker({ color: "#c45c32", draggable: true })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setDraft((prev) => (prev ? { ...prev, lat: lngLat.lat, lng: lngLat.lng, accuracy: 1 } : prev));
      });
      draftRef.current = marker;
    } else {
      draftRef.current.setLngLat([draft.lng, draft.lat]);
    }
  }, [adding, draft]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    getTreeDetailAction(selectedId).then(setDetail);
  }, [selectedId]);

  useEffect(() => {
    if (!boundaryOn || !fix) return;
    setBoundaryPts((prev) => {
      const last = prev[prev.length - 1];
      if (last && haversineMeters(last, fix) < 8) return prev;
      return [...prev, { lat: fix.lat, lng: fix.lng }];
    });
  }, [boundaryOn, fix]);

  function startAdd() {
    const map = mapRef.current;
    const center = map?.getCenter();
    const gpsOnFarm =
      fix && haversineMeters(fix, farmCoords) < 1500
        ? { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy }
        : null;
    const loc = gpsOnFarm ?? {
      lat: center?.lat ?? farmCoords.lat,
      lng: center?.lng ?? farmCoords.lng,
      accuracy: null,
    };
    setAdding(true);
    setSelectedId(null);
    setDraft(loc);
    map?.easeTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 18) });
  }

  const speciesNames = useMemo(() => Array.from(new Set(trees.map((t) => t.species))).sort(), [trees]);

  return (
    <div className="relative h-full min-h-[24rem] overflow-hidden bg-soil">
      <div ref={container} className="absolute inset-0" />

      <div className="absolute inset-x-0 top-0 z-10 p-3">
        <div className="rounded-[1.25rem] bg-paper/95 px-3 py-2 shadow">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold">
              {trees.length} / {treeCensusTarget}
              {watchCount ? <span className="ml-2 text-clay">{watchCount} on watch</span> : null}
            </p>
            <span className="shrink-0 rounded-full bg-cream px-2 py-1">
              <GpsBadge fix={fix} error={error} />
            </span>
            <button
              type="button"
              data-on={filtersOpen ? "true" : "false"}
              className="admin-chip shrink-0"
              onClick={() => setFiltersOpen((value) => !value)}
            >
              Filters
            </button>
          </div>
          {filtersOpen ? (
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <div className="flex gap-2 overflow-x-auto">
                <Chip on={healthFilter === "all"} onClick={() => setHealthFilter("all")}>
                  All
                </Chip>
                {healthOptions.map((opt) => (
                  <Chip key={opt.value} on={healthFilter === opt.value} onClick={() => setHealthFilter(opt.value)}>
                    {opt.label}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Chip on={speciesFilter === "all"} onClick={() => setSpeciesFilter("all")}>
                  Every species
                </Chip>
                {speciesNames.map((name) => (
                  <Chip key={name} on={speciesFilter === name} onClick={() => setSpeciesFilter(name)}>
                    {name}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Chip on={yearFilter === "all"} onClick={() => setYearFilter("all")}>
                  Any year
                </Chip>
                {YEARS.map((year) => (
                  <Chip key={year} on={yearFilter === String(year)} onClick={() => setYearFilter(String(year))}>
                    {year}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Chip on={showPlots} onClick={() => setShowPlots((value) => !value)}>
                  Plots
                </Chip>
                <Chip on={showHealth} onClick={() => setShowHealth((value) => !value)}>
                  Health clusters
                </Chip>
                {droneTileUrl ? (
                  <Chip on={showDrone} onClick={() => setShowDrone((value) => !value)}>
                    Drone layer
                  </Chip>
                ) : null}
              </div>
              {boundaryOn ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-leaf-deep"
                  onClick={() => {
                    setBoundaryOn(false);
                    setBoundaryPts([]);
                  }}
                >
                  Cancel boundary walk
                </button>
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold text-leaf-deep"
                  onClick={() => {
                    setBoundaryPts([]);
                    setBoundaryOn(true);
                    setFiltersOpen(false);
                  }}
                >
                  Walk boundary
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-4 right-3 z-10">
        {boundaryOn ? (
          <button
            type="button"
            className="tap rounded-full bg-cream px-5 text-base font-semibold text-leaf-deep shadow-lg"
            onClick={() => {
              start(async () => {
                const result = await saveBoundaryAction(boundaryPts);
                if (result.ok) {
                  setBoundaryOn(false);
                  router.refresh();
                }
              });
            }}
            disabled={pending || boundaryPts.length < 3}
          >
            Save boundary ({boundaryPts.length})
          </button>
        ) : (
          <button
            type="button"
            onClick={startAdd}
            className="tap rounded-full bg-leaf px-6 text-base font-semibold text-leaf-deep shadow-lg"
          >
            Add tree
          </button>
        )}
      </div>

      {adding && draft ? (
        <TreeCapture
          draft={draft}
          species={species}
          trees={trees}
          visionEnabled={visionEnabled}
          onClose={() => {
            setAdding(false);
            setDraft(null);
          }}
          onSaved={() => {
            setAdding(false);
            setDraft(null);
            router.refresh();
          }}
        />
      ) : null}

      {detail?.tree && !adding ? (
        <div className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl">
          <div className="flex gap-3">
            {detail.tree.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.tree.photoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl"
                style={{ background: HEALTH_COLOR[detail.tree.health as TreeHealth] }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-3xl leading-tight">{detail.tree.species}</p>
              <p className="mt-1 text-base text-ink-soft">
                {treeAgeLabel(detail.tree.plantingYear, detail.tree.plantedOn)} · {detail.tree.health}
                {detail.tree.habit ? ` · ${detail.tree.habit}` : ""}
              </p>
              {detail.tree.accuracyM != null ? (
                <p className="text-xs text-muted">Pinned ±{Math.round(detail.tree.accuracyM)} m</p>
              ) : null}
            </div>
            <button type="button" className="text-sm text-muted" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
          {detail.tree.note ? <p className="mt-3 text-sm">{detail.tree.note}</p> : null}
          <div className="mt-3 flex gap-2">
            <Link
              href={`/admin/log?domain=trees&treeId=${detail.tree.id}`}
              className="tap flex-1 rounded-full bg-leaf-deep text-center text-sm font-semibold leading-[48px] text-cream"
            >
              Log on this tree
            </Link>
            <Link
              href={`/admin/log?domain=plant_health&treeId=${detail.tree.id}`}
              className="tap flex-1 rounded-full border border-line text-center text-sm font-semibold leading-[48px]"
            >
              Health note
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {detail.notes.map((note) => (
              <li key={note.id} className="rounded-2xl bg-cream px-3 py-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{note.domain}</p>
                <p>{note.note || "Logged"}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TreeCapture({
  draft,
  species,
  trees,
  visionEnabled,
  onClose,
  onSaved,
}: {
  draft: { lat: number; lng: number; accuracy: number | null };
  species: { name: string; tamil: string | null }[];
  trees: TreePin[];
  visionEnabled: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [force, setForce] = useState(false);
  const [health, setHealth] = useState<TreeHealth>("healthy");
  const [habit, setHabit] = useState("sapling");
  const [year, setYear] = useState(2024);
  const [speciesName, setSpeciesName] = useState(species[0]?.name ?? "");
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const nearby = nearestPoints(draft, trees, DUPLICATE_TREE_METERS);

  return (
    <form
      className="absolute inset-x-0 bottom-0 z-30 max-h-[78%] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl"
      action={(formData) => {
        setMessage(null);
        start(async () => {
          const result = await createTreeAction(formData);
          if ("duplicate" in result && result.duplicate && !force) {
            setMessage(
              `Possible duplicate: ${result.duplicate.species} ${result.duplicate.meters} m away. Save anyway?`,
            );
            setForce(true);
            return;
          }
          if (!result.ok) {
            setMessage("error" in result && result.error ? result.error : "Could not save.");
            return;
          }
          onSaved();
        });
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-3xl">New tree</h2>
        <button type="button" onClick={onClose} className="text-sm text-muted">
          Cancel
        </button>
      </div>
      <p className="text-sm text-ink-soft">
        Stand at the stem. Drag the red pin if GPS drifts.{" "}
        {draft.accuracy != null ? `±${Math.round(draft.accuracy)} m` : "Map pin."}
      </p>

      <input type="hidden" name="lat" value={draft.lat} />
      <input type="hidden" name="lng" value={draft.lng} />
      <input type="hidden" name="accuracyM" value={draft.accuracy ?? ""} />
      <input type="hidden" name="health" value={health} />
      <input type="hidden" name="habit" value={habit} />
      <input type="hidden" name="plantingYear" value={year} />
      <input type="hidden" name="force" value={force ? "1" : ""} />
      {ai ? <input type="hidden" name="aiSuggestion" value={JSON.stringify(ai)} /> : null}

      <label className="admin-camera mt-4">
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : null);
            if (!file || !visionEnabled) return;
            const fd = new FormData();
            fd.set("photo", file);
            start(async () => {
              const result = await suggestTreeVisionAction(fd);
              if (result.ok) {
                setAi(result.suggestion);
                if (result.suggestion.species && result.suggestion.species !== "unknown") {
                  setSpeciesName(result.suggestion.species);
                }
                if (result.suggestion.health) setHealth(result.suggestion.health);
                if (result.suggestion.habit) setHabit(result.suggestion.habit);
              }
            });
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" />
        ) : (
          <span className="px-4 text-center text-base font-semibold text-ink-soft">Tap to photograph this stem</span>
        )}
      </label>

      {ai ? (
        <p className="mt-2 rounded-2xl bg-cream px-3 py-2 text-sm">
          AI suggests <strong>{ai.species}</strong>
          {ai.tamil ? ` (${ai.tamil})` : ""} · {ai.health} · {Math.round(ai.confidence * 100)}%. Confirm or
          change below.
        </p>
      ) : visionEnabled ? (
        <p className="mt-2 text-xs text-muted">A photo can suggest species and health. You always confirm.</p>
      ) : null}

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Species</span>
        <input
          name="species"
          list="species-list"
          required
          value={speciesName}
          onChange={(e) => setSpeciesName(e.target.value)}
          className="tap w-full rounded-2xl border border-line bg-white px-3"
        />
        <datalist id="species-list">
          {species.map((row) => (
            <option key={row.name} value={row.name}>
              {row.tamil ?? ""}
            </option>
          ))}
        </datalist>
      </label>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Planting year</p>
      <div className="mt-1 flex gap-2">
        {YEARS.map((value) => (
          <Chip key={value} on={year === value} onClick={() => setYear(value)}>
            {value}
          </Chip>
        ))}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Habit</p>
      <div className="mt-1 flex gap-2">
        {habitOptions.map((opt) => (
          <Chip key={opt.value} on={habit === opt.value} onClick={() => setHabit(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Health</p>
      <div className="mt-1 flex gap-2">
        {healthOptions.map((opt) => (
          <Chip key={opt.value} on={health === opt.value} onClick={() => setHealth(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Zone</span>
        <select name="zone" className="tap w-full rounded-2xl border border-line bg-white px-3">
          {zoneLabels.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Note</span>
        <textarea name="note" rows={2} className="w-full rounded-2xl border border-line bg-white px-3 py-2" />
      </label>

      {nearby[0] ? (
        <p className="mt-3 text-sm text-clay">
          {nearby[0].item.species} is {Math.round(nearby[0].meters * 10) / 10} m away. Check it is not the same
          stem.
        </p>
      ) : null}
      {message ? <p className="mt-2 text-sm font-semibold text-clay">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="tap mt-4 w-full rounded-full bg-leaf-deep font-semibold text-cream disabled:opacity-60"
      >
        {pending ? "Saving…" : force ? "Save anyway" : "Pin this tree"}
      </button>
    </form>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" data-on={on ? "true" : "false"} onClick={onClick} className="admin-chip shrink-0">
      {children}
    </button>
  );
}

function emptyFc() {
  return { type: "FeatureCollection" as const, features: [] };
}
