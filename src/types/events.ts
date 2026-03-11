export type EventCategory =
  | "Recovery"
  | "Mental Health"
  | "Housing"
  | "Social"
  | "Employment"
  | "Family";

export interface DiscoveryEvent {
  id: string;
  title: string;
  organizationName: string;
  organizationId: string;
  startAtIso: string;
  endAtIso: string | null;
  locationName: string | null;
  city: string | null;
  postcode: string | null;
  description: string | null;
  imageUrl: string | null;
  categories: EventCategory[];
  isScraped: boolean;
}
