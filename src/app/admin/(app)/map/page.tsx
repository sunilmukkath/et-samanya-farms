import { FarmMapLoader } from "@/components/admin/FarmMapLoader";
import { latestReadings, listDevices, listObservations, listPlots, listSpecies, listTrees, listZones } from "@/db/queries";
import { droneTileUrl, isVisionConfigured } from "@/lib/farm";
import { getRuntimeFarm } from "@/lib/profile";

async function settled<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function AdminMapPage({
  searchParams,
}: {
  searchParams: Promise<{ walkPlot?: string }>;
}) {
  const runtime = await getRuntimeFarm();
  const { walkPlot } = await searchParams;
  const [trees, species, zones, plots, healthRows, devices, readings] = await Promise.all([
    settled(listTrees(), []),
    settled(listSpecies(), []),
    settled(listZones(), []),
    settled(listPlots(), []),
    settled(listObservations({ domain: "plant_health", limit: 80 }), []),
    settled(listDevices(), []),
    settled(latestReadings(), []),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <FarmMapLoader
      trees={trees.map((tree) => ({
        id: tree.id,
        lat: tree.lat,
        lng: tree.lng,
        accuracyM: tree.accuracyM,
        species: tree.species,
        plantingYear: tree.plantingYear,
        plantedOn: tree.plantedOn ? new Date(tree.plantedOn).toISOString() : null,
        health: tree.health,
        habit: tree.habit,
        photoUrl: tree.photoUrl,
        note: tree.note,
        zone: tree.zone,
      }))}
      species={species.map((row) => ({ name: row.name, tamil: row.tamil }))}
      zones={zones.map((zone) => ({ name: zone.name, polygon: zone.polygon }))}
      plots={plots.map((plot) => ({
        id: plot.id,
        name: plot.name,
        kind: plot.kind,
        polygon: plot.polygon,
      }))}
      healthEvents={healthRows
        .filter((row) => row.lat != null && row.lng != null)
        .map((row) => ({
          id: row.id,
          lat: row.lat as number,
          lng: row.lng as number,
          label: row.details?.aiSuggestion?.issue || row.details?.crop || row.note || "Health",
        }))}
      droneTileUrl={droneTileUrl()}
      visionEnabled={isVisionConfigured()}
      farmCenter={runtime.farmCoords}
      censusTarget={runtime.treeCensusTarget ?? 0}
      zoneChoices={runtime.zoneLabels}
      walkPlotId={walkPlot || null}
      devices={devices
        .filter((device) => device.lat != null && device.lng != null)
        .map((device) => {
          const latest = readings.find((row) => row.deviceId === device.id);
          return {
            id: device.id,
            name: device.name,
            kind: device.kind,
            lat: device.lat as number,
            lng: device.lng as number,
            status: device.status,
            lastValue: latest ? `${latest.value}${latest.unit ?? ""}` : undefined,
          };
        })}
    />
    </div>
  );
}

