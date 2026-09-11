import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const DEFAULT_SOURCE_URL = "https://almeirim.city/onde-comer";
const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FOOD_AMENITIES = [
  "bar",
  "biergarten",
  "cafe",
  "fast_food",
  "food_court",
  "ice_cream",
  "pub",
  "restaurant",
] as const;
const NON_FOOD_SUBCATEGORIES = new Set([
  "cama e cafe",
  "deposito",
  "hipermercado",
  "joalheria",
  "local para eventos",
  "loja",
  "marco historico",
  "mercado de produtos agricolas",
  "parque",
]);

interface SourcePlace {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  opening_hours: string | null;
  source: string;
  source_id: string;
  imported_at: string;
  google_place_id: string | null;
  osm_id: string | null;
  google_rating?: number | null;
  google_reviews?: number | null;
  image?: string | null;
  description?: string | null;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface OsmPlace {
  osmId: string;
  name: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
}

interface MatchResult {
  osm: OsmPlace;
  confidence: number;
  reason: string;
  distanceMeters: number | null;
}

interface CliOptions {
  sourceUrl: string;
  overpassUrl: string;
  outputDirectory: string | null;
  sourceFile: string | null;
  skipOsm: boolean;
}

function parseArguments(argv: string[]): CliOptions {
  const options: CliOptions = {
    sourceUrl: DEFAULT_SOURCE_URL,
    overpassUrl: DEFAULT_OVERPASS_URL,
    outputDirectory: null,
    sourceFile: null,
    skipOsm: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--skip-osm") {
      options.skipOsm = true;
      continue;
    }

    const value = argv[index + 1];

    if (!value) {
      throw new Error(`Missing value for ${argument}`);
    }

    if (argument === "--source-url") {
      options.sourceUrl = value;
    } else if (argument === "--overpass-url") {
      options.overpassUrl = value;
    } else if (argument === "--output-directory") {
      options.outputDirectory = value;
    } else if (argument === "--source-file") {
      options.sourceFile = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }

    index += 1;
  }

  return options;
}

async function findRepositoryRoot(startDirectory: string): Promise<string> {
  let directory = resolve(startDirectory);

  while (true) {
    try {
      const packageJson = JSON.parse(
        await readFile(join(directory, "package.json"), "utf8"),
      ) as { workspaces?: unknown };

      if (Array.isArray(packageJson.workspaces)) {
        return directory;
      }
    } catch {
      // Continue walking up until the workspace root is found.
    }

    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error("Could not find the npm workspace root");
    }
    directory = parent;
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "ClubeRibatejo/0.1 public-directory-inventory",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

function decodeNextFlightPayload(html: string): string {
  const payloadPattern =
    /self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)<\/script>/gs;
  const chunks: string[] = [];

  for (const match of html.matchAll(payloadPattern)) {
    chunks.push(JSON.parse(match[1]) as string);
  }

  if (chunks.length === 0) {
    throw new Error("No Next.js data payload was found in the source page");
  }

  return chunks.join("");
}

function readJsonObjectAt(payload: string, start: number): string | null {
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (let index = start; index < payload.length; index += 1) {
    const character = payload[index];

    if (insideString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        insideString = false;
      }
      continue;
    }

    if (character === '"') {
      insideString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return payload.slice(start, index + 1);
      }
    }
  }

  return null;
}

function isSourcePlace(value: unknown): value is SourcePlace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SourcePlace>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    candidate.category === "restauração" &&
    !NON_FOOD_SUBCATEGORIES.has(normalizeText(candidate.subcategory)) &&
    typeof candidate.source === "string" &&
    typeof candidate.source_id === "string"
  );
}

function extractSourcePlaces(html: string): SourcePlace[] {
  const payload = decodeNextFlightPayload(html);
  const places = new Map<string, SourcePlace>();
  let cursor = 0;

  while (cursor < payload.length) {
    const start = payload.indexOf('{"id":', cursor);
    if (start === -1) {
      break;
    }

    const rawObject = readJsonObjectAt(payload, start);
    if (!rawObject) {
      break;
    }

    try {
      const candidate: unknown = JSON.parse(rawObject);
      if (isSourcePlace(candidate)) {
        places.set(candidate.id, candidate);
      }
    } catch {
      // Ignore unrelated React payload objects and continue scanning.
    }

    cursor = start + rawObject.length;
  }

  if (places.size === 0) {
    throw new Error(
      "No food establishments were extracted from the source page",
    );
  }

  return [...places.values()];
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(lda|limitada|unipessoal)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.startsWith("351") ? digits.slice(3) : digits;
}

function hostname(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function tokens(value: string | null | undefined): Set<string> {
  return new Set(normalizeText(value).split(" ").filter(Boolean));
}

function jaccard(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  );
  const union = new Set([...leftTokens, ...rightTokens]);
  return intersection.length / union.size;
}

function distanceMeters(
  leftLatitude: number,
  leftLongitude: number,
  rightLatitude: number,
  rightLongitude: number,
): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latitudeDelta = toRadians(rightLatitude - leftLatitude);
  const longitudeDelta = toRadians(rightLongitude - leftLongitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(leftLatitude)) *
      Math.cos(toRadians(rightLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function osmAddress(tags: Record<string, string>): string | null {
  const street = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const locality = tags["addr:city"] ?? tags["addr:place"];
  const address = [street, tags["addr:postcode"], locality]
    .filter(Boolean)
    .join(", ");
  return address || null;
}

function mapOsmElements(elements: OverpassElement[]): OsmPlace[] {
  return elements.flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;

    if (latitude === undefined || longitude === undefined) {
      return [];
    }

    const tags = element.tags ?? {};
    return [
      {
        osmId: `${element.type}-${element.id}`,
        name: tags.name ?? null,
        category: tags.amenity ?? tags.shop ?? tags.craft ?? null,
        latitude,
        longitude,
        address: osmAddress(tags),
        phone: tags.phone ?? tags["contact:phone"] ?? null,
        website: tags.website ?? tags["contact:website"] ?? null,
        openingHours: tags.opening_hours ?? null,
      },
    ];
  });
}

function sourceBounds(places: SourcePlace[]): [number, number, number, number] {
  const locations = places.filter(
    (place): place is SourcePlace & { lat: number; lng: number } =>
      typeof place.lat === "number" && typeof place.lng === "number",
  );

  if (locations.length === 0) {
    throw new Error(
      "Source data has no coordinates for the OpenStreetMap query",
    );
  }

  const padding = 0.015;
  return [
    Math.min(...locations.map((place) => place.lat)) - padding,
    Math.min(...locations.map((place) => place.lng)) - padding,
    Math.max(...locations.map((place) => place.lat)) + padding,
    Math.max(...locations.map((place) => place.lng)) + padding,
  ];
}

async function fetchOsmPlaces(
  endpoint: string,
  bounds: [number, number, number, number],
): Promise<OsmPlace[]> {
  const bbox = bounds.join(",");
  const amenities = FOOD_AMENITIES.join("|");
  const query = `[out:json][timeout:60];(
    nwr["amenity"~"^(${amenities})$"](${bbox});
    nwr["shop"~"^(bakery|coffee|confectionery|deli)$"](${bbox});
    nwr["craft"="winery"](${bbox});
  );out center tags;`;
  const response = await fetch(endpoint, {
    body: new URLSearchParams({ data: query }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "ClubeRibatejo/0.1 public-directory-inventory",
    },
    method: "POST",
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed (${response.status})`);
  }

  const data = (await response.json()) as OverpassResponse;
  return mapOsmElements(data.elements);
}

function matchOsmPlace(
  place: SourcePlace,
  candidates: OsmPlace[],
): MatchResult | null {
  const exactOsmId =
    place.osm_id ?? (place.source === "osm" ? place.source_id : null);
  if (exactOsmId) {
    const exact = candidates.find(
      (candidate) => candidate.osmId === exactOsmId,
    );
    if (exact) {
      return { confidence: 1, distanceMeters: 0, osm: exact, reason: "osm_id" };
    }
  }

  const placePhone = normalizePhone(place.phone);
  const placeHostname = hostname(place.website);
  let best: MatchResult | null = null;

  for (const candidate of candidates) {
    const distance =
      place.lat === null || place.lng === null
        ? null
        : distanceMeters(
            place.lat,
            place.lng,
            candidate.latitude,
            candidate.longitude,
          );

    if (distance !== null && distance > 1_000) {
      continue;
    }

    const candidatePhone = normalizePhone(candidate.phone);
    if (placePhone.length >= 9 && placePhone === candidatePhone) {
      return {
        confidence: 0.99,
        distanceMeters: distance,
        osm: candidate,
        reason: "phone",
      };
    }

    const candidateHostname = hostname(candidate.website);
    if (placeHostname && placeHostname === candidateHostname) {
      return {
        confidence: 0.97,
        distanceMeters: distance,
        osm: candidate,
        reason: "website",
      };
    }

    const nameScore = jaccard(place.name, candidate.name);
    const addressScore = jaccard(place.address, candidate.address);
    const distanceScore =
      distance === null
        ? 0
        : distance <= 25
          ? 1
          : distance <= 100
            ? 0.75
            : distance <= 300
              ? 0.4
              : 0.1;
    const confidence =
      nameScore * 0.6 + distanceScore * 0.3 + addressScore * 0.1;

    if (confidence >= 0.55 && (!best || confidence > best.confidence)) {
      best = {
        confidence,
        distanceMeters: distance,
        osm: candidate,
        reason: "name_distance_address",
      };
    }
  }

  return best;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text =
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
      ? String(value)
      : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvCell(row[header])).join(","),
    ),
  ].join("\n");
}

function findDuplicateCandidates(places: SourcePlace[]): unknown[] {
  const duplicates: unknown[] = [];

  for (let leftIndex = 0; leftIndex < places.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < places.length;
      rightIndex += 1
    ) {
      const left = places[leftIndex];
      const right = places[rightIndex];
      const sameGoogleId =
        Boolean(left.google_place_id) &&
        left.google_place_id === right.google_place_id;
      const samePhone =
        normalizePhone(left.phone).length >= 9 &&
        normalizePhone(left.phone) === normalizePhone(right.phone);
      const distance =
        left.lat === null ||
        left.lng === null ||
        right.lat === null ||
        right.lng === null
          ? null
          : distanceMeters(left.lat, left.lng, right.lat, right.lng);
      const sameName = normalizeText(left.name) === normalizeText(right.name);

      if (
        sameGoogleId ||
        samePhone ||
        (sameName && distance !== null && distance <= 150)
      ) {
        duplicates.push({
          distanceMeters: distance === null ? null : Math.round(distance),
          left: { id: left.id, name: left.name },
          reason: sameGoogleId
            ? "google_place_id"
            : samePhone
              ? "phone"
              : "name_distance",
          right: { id: right.id, name: right.name },
        });
      }
    }
  }

  return duplicates;
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const repositoryRoot = await findRepositoryRoot(process.cwd());
  const outputDirectory = options.outputDirectory
    ? resolve(options.outputDirectory)
    : join(repositoryRoot, "data", "food-directory");
  const retrievedAt = new Date().toISOString();
  const html = options.sourceFile
    ? await readFile(resolve(options.sourceFile), "utf8")
    : await fetchText(options.sourceUrl);
  const sourcePlaces = extractSourcePlaces(html);
  const bounds = sourceBounds(sourcePlaces);
  const osmPlaces = options.skipOsm
    ? []
    : await fetchOsmPlaces(options.overpassUrl, bounds);
  const matches = new Map(
    sourcePlaces.map((place) => [place.id, matchOsmPlace(place, osmPlaces)]),
  );

  const inventory = sourcePlaces
    .map((place) => {
      const match = matches.get(place.id) ?? null;
      const osm = match?.osm;
      const useOsmAddress = Boolean(osm?.address);
      const useOsmPhone = Boolean(osm?.phone);
      const useOsmWebsite = Boolean(osm?.website);

      return {
        id: place.id,
        name: place.name.trim(),
        slug: place.slug.replace(/-apify-$/, "").replace(/-[a-f0-9]{6}$/, ""),
        category: place.subcategory ?? place.category,
        address: useOsmAddress ? osm?.address : place.address,
        phone: useOsmPhone ? osm?.phone : place.phone || null,
        website: useOsmWebsite ? osm?.website : place.website,
        openingHours: osm?.openingHours ?? null,
        latitude: osm?.latitude ?? place.lat,
        longitude: osm?.longitude ?? place.lng,
        externalIds: {
          almeirimCity: place.id,
          googlePlaceId: place.google_place_id,
          openStreetMap: osm?.osmId ?? place.osm_id,
        },
        fieldSources: {
          address: useOsmAddress ? "openstreetmap" : "almeirim.city",
          coordinates: osm ? "openstreetmap" : "almeirim.city",
          name: "almeirim.city",
          openingHours: osm?.openingHours ? "openstreetmap" : null,
          phone: useOsmPhone ? "openstreetmap" : "almeirim.city",
          website: useOsmWebsite ? "openstreetmap" : "almeirim.city",
        },
        sourceAudit: {
          almeirimCityImportedAt: place.imported_at,
          almeirimCitySource: place.source,
          osmMatch: match
            ? {
                confidence: Number(match.confidence.toFixed(3)),
                distanceMeters:
                  match.distanceMeters === null
                    ? null
                    : Math.round(match.distanceMeters),
                reason: match.reason,
              }
            : null,
          retrievedAt,
        },
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt"));

  const csvRows = inventory.map((place) => ({
    id: place.id,
    name: place.name,
    slug: place.slug,
    category: place.category,
    address: place.address,
    phone: place.phone,
    website: place.website,
    opening_hours: place.openingHours,
    latitude: place.latitude,
    longitude: place.longitude,
    google_place_id: place.externalIds.googlePlaceId,
    osm_id: place.externalIds.openStreetMap,
    osm_match_confidence: place.sourceAudit.osmMatch?.confidence ?? null,
  }));
  const duplicateCandidates = findDuplicateCandidates(sourcePlaces);
  const matchedCount = [...matches.values()].filter(Boolean).length;
  const report = {
    generatedAt: retrievedAt,
    policy: {
      excluded: [
        "external descriptions",
        "external photos",
        "external ratings",
        "external review counts",
        "external review text",
      ],
      reviewsSource: "Clube Ribatejo customers only",
    },
    source: {
      extracted: sourcePlaces.length,
      googlePlaceIds: sourcePlaces.filter((place) => place.google_place_id)
        .length,
      url: options.sourceUrl,
    },
    openStreetMap: {
      bounds,
      candidates: osmPlaces.length,
      endpoint: options.skipOsm ? null : options.overpassUrl,
      matched: matchedCount,
      unmatched: sourcePlaces.length - matchedCount,
    },
    duplicateCandidates,
    discardedThirdPartyFields: {
      descriptions: sourcePlaces.filter((place) => place.description).length,
      images: sourcePlaces.filter((place) => place.image).length,
      ratings: sourcePlaces.filter((place) => place.google_rating !== null)
        .length,
      reviewCounts: sourcePlaces.filter(
        (place) => place.google_reviews !== null,
      ).length,
    },
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      join(outputDirectory, "inventory.json"),
      `${JSON.stringify(inventory, null, 2)}\n`,
    ),
    writeFile(join(outputDirectory, "inventory.csv"), `${toCsv(csvRows)}\n`),
    writeFile(
      join(outputDirectory, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    ),
  ]);

  console.log(`Extracted ${sourcePlaces.length} establishments.`);
  console.log(
    `OpenStreetMap candidates: ${osmPlaces.length}; matched: ${matchedCount}.`,
  );
  console.log(`Duplicate candidates: ${duplicateCandidates.length}.`);
  console.log(`Inventory written to ${outputDirectory}.`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Food inventory failed: ${message}`);
  process.exitCode = 1;
});
