export { catalogDomains, domainCatalogBySlug } from "@/lib/packs/domains";
export { packById, practicePacks } from "@/lib/packs/catalog";
export {
  defaultDomainForGroup,
  groupForDomain,
  groupsFor,
  isCaptureGroupId,
} from "@/lib/packs/groups";
export { domainFields, isPackId, resolveFarm } from "@/lib/packs/resolve";
export type {
  AdminModule,
  CaptureField,
  DomainDef,
  FarmProfile,
  FarmRule,
  PackId,
  PracticePack,
  RuntimeFarm,
} from "@/lib/packs/types";
export type { CaptureGroupId } from "@/lib/packs/groups";
