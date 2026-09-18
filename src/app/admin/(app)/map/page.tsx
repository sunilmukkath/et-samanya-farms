import { FarmMapLoader } from "@/components/admin/FarmMapLoader";
import { listSpecies, listTrees, listZones } from "@/db/queries";
import { isVisionConfigured } from "@/lib/farm";

export default async function AdminMapPage() {
  const [trees, species, zones] = await Promise.all([listTrees(), listSpecies(), listZones()]);

  return (
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
      visionEnabled={isVisionConfigured()}
    />
  );
}
