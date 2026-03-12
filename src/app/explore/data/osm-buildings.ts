export interface OSMBuilding {
  id: number;
  name: string;
  category: string;
  color: string;
  categoryLabel: string;
  footprint: Array<{ x: number; z: number }>;
  centroid: { x: number; z: number };
  tags: Record<string, string>;
}

type Category =
  | "college"
  | "restaurant"
  | "park"
  | "retail"
  | "landmark"
  | "cultural"
  | "other";

const CATEGORY_COLORS: Record<Category, string> = {
  college: "#3B82F6",
  restaurant: "#F97316",
  park: "#22C55E",
  retail: "#EAB308",
  landmark: "#EF4444",
  cultural: "#A855F7",
  other: "#9CA3AF",
};

const CATEGORY_LABELS: Record<Category, string> = {
  college: "🎓 College",
  restaurant: "🍽️ Restaurant",
  park: "🌳 Park",
  retail: "🛍️ Retail",
  landmark: "📍 Landmark",
  cultural: "🎭 Cultural",
  other: "🏢 Other",
};

export function classifyBuilding(tags: Record<string, string>): {
  category: Category;
  color: string;
  label: string;
} {
  const amenity = tags.amenity ?? "";
  const building = tags.building ?? "";
  const leisure = tags.leisure ?? "";
  const shop = tags.shop ?? "";
  const tourism = tags.tourism ?? "";
  const historic = tags.historic ?? "";

  let category: Category;

  if (
    amenity === "university" ||
    amenity === "college" ||
    building === "university"
  ) {
    category = "college";
  } else if (
    amenity === "restaurant" ||
    amenity === "cafe" ||
    amenity === "fast_food" ||
    amenity === "bar" ||
    amenity === "pub"
  ) {
    category = "restaurant";
  } else if (
    leisure === "park" ||
    leisure === "garden" ||
    leisure === "playground"
  ) {
    category = "park";
  } else if (shop !== "") {
    category = "retail";
  } else if (tourism !== "" || historic !== "") {
    category = "landmark";
  } else if (
    amenity === "theatre" ||
    amenity === "cinema" ||
    amenity === "library" ||
    amenity === "arts_centre" ||
    amenity === "community_centre"
  ) {
    category = "cultural";
  } else {
    category = "other";
  }

  return {
    category,
    color: CATEGORY_COLORS[category],
    label: CATEGORY_LABELS[category],
  };
}

const CENTER_LAT = 34.0965;
const CENTER_LON = -117.7185;

export function osmToLocal(lat: number, lon: number): { x: number; z: number } {
  const x =
    (lon - CENTER_LON) * 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);
  const z = -(lat - CENTER_LAT) * 110540;
  return { x, z };
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_KEY = "claremont-osm-buildings";
const BBOX = "34.085,-117.730,34.110,-117.700";

const OVERPASS_QUERY = `[out:json][timeout:30];
(
  way["building"]["name"](${BBOX});
  way["amenity"](${BBOX});
  way["shop"](${BBOX});
  way["leisure"](${BBOX});
  way["tourism"](${BBOX});
);
out geom;`;

interface OverpassNode {
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: "way" | "node" | "relation";
  id: number;
  tags?: Record<string, string>;
  geometry?: OverpassNode[];
  lat?: number;
  lon?: number;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function computeCentroid(
  points: Array<{ x: number; z: number }>
): { x: number; z: number } {
  if (points.length === 0) return { x: 0, z: 0 };
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
    { x: 0, z: 0 }
  );
  return { x: sum.x / points.length, z: sum.z / points.length };
}

export async function fetchOSMBuildings(): Promise<OSMBuilding[]> {
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as OSMBuilding[];
      } catch {
        // ignore corrupt cache
      }
    }
  }

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data: OverpassResponse = await response.json();

  const buildings: OSMBuilding[] = [];

  for (const element of data.elements) {
    if (element.type !== "way") continue;

    const tags = element.tags ?? {};
    const name = tags.name;
    if (!name) continue;

    const geometry = element.geometry;
    if (!geometry || geometry.length < 3) continue;

    const footprint = geometry.map((node) => osmToLocal(node.lat, node.lon));
    const centroid = computeCentroid(footprint);
    const { category, color, label } = classifyBuilding(tags);

    buildings.push({
      id: element.id,
      name,
      category,
      color,
      categoryLabel: label,
      footprint,
      centroid,
      tags,
    });
  }

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(buildings));
    } catch {
      // storage quota exceeded — skip caching
    }
  }

  return buildings;
}
