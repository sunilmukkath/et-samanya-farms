import { FarmMapLoader } from "@/components/admin/FarmMapLoader";
import { listObservations, listPlots, listSpecies, listTrees, listZones } from "@/db/queries";
import { droneTileUrl, isVisionConfigured } from "@/lib/farm";

export default async function AdminMapPage() {
  const [trees, species, zones, plots, healthRows] = await Promise.all([
    listTrees(),
    listSpecies(),
    listZones(),
    listPlots(),
    listObservations({ domain: "plant_health", limit: 80 }),
  ]);

  return (
    <div className="min-h-0 flex-1">
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
    />
    </div>
  );
}
