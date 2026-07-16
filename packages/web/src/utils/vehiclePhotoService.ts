interface VehiclePhotoSearchInput {
  year?: string;
  make?: string;
  model?: string;
  vehicleType?: string;
}

interface VehiclePhotoResult {
  url: string;
  source: 'wikimedia';
  attributionUrl?: string;
  attributionText?: string;
}

function buildQueries(input: VehiclePhotoSearchInput) {
  const year = (input.year || '').trim();
  const make = (input.make || '').trim();
  const model = (input.model || '').trim();
  const vehicleType = (input.vehicleType || '').trim();

  const core = [year, make, model].filter(Boolean).join(' ').trim();
  const withType = [core, vehicleType].filter(Boolean).join(' ').trim();

  return [
    withType,
    core,
    `${make} ${model}`.trim(),
    `${make} ${model} vehicle`.trim(),
  ]
    .map(query => query.trim())
    .filter(Boolean);
}

async function searchWikipediaImage(
  query: string
): Promise<VehiclePhotoResult | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '5',
    prop: 'pageimages|info',
    piprop: 'thumbnail',
    pithumbsize: '800',
    inprop: 'url',
  });

  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          fullurl?: string;
          thumbnail?: { source?: string };
        }
      >;
    };
  };

  const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
  const match = pages.find(page => Boolean(page.thumbnail?.source));
  if (!match?.thumbnail?.source) {
    return null;
  }

  return {
    url: match.thumbnail.source,
    source: 'wikimedia',
    attributionUrl: match.fullurl,
    attributionText: match.title,
  };
}

export async function findVehiclePhotoFromWeb(
  input: VehiclePhotoSearchInput
): Promise<VehiclePhotoResult | null> {
  const queries = buildQueries(input);

  for (const query of queries) {
    try {
      const result = await searchWikipediaImage(query);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('Vehicle photo lookup failed for query:', query, error);
    }
  }

  return null;
}
