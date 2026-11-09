/*
 * Cresta content — single source of truth for:
 *   1. the initial rows seeded into the `cresta` Supabase schema (npm run db:migrate)
 *   2. the site's built-in fallback if Supabase is unreachable
 * After seeding, edit content in the database; this file is only the starting point.
 */

// Documents are requested through the Cresta enquiry form (no links to external sites).
// To publish a real file later, put it in public/docs/ and set the url to /docs/<file>.pdf.
const request = (product, type = 'equipment') => `/contact?type=${type}&product=${encodeURIComponent(product)}`;

export const SETTINGS = {
  phone_display: '+91 95525 26371',
  phone_tel: '+919552526371',
  landline: '(020) 2469 0602',
  whatsapp: '919552526371',
  email: 'sales@crystalpools.in',
  office_address: 'Sr. No. 10/1/1, Shed No. 3 & 4, Nr. Kailash Jeevan Factory, Dhayari, Pune, Maharashtra 411041',
  factory_address: 'At Post Shive, Tal. Khed, Dist. Pune, Maharashtra 410501',
  hours_week: 'Mon – Sat, 10:00 AM – 6:00 PM',
  hours_sunday: 'Closed',
  branches: 'Pune, Mumbai, Nashik, Kolhapur, Rajasthan, Goa',
  brochure_url: request('FRP pool brochure', 'frp'),
  site_title: 'FRP Swimming Pools & Pool Pumps Manufacturer India | Cresta',
  site_description: 'Cresta makes one-piece FRP swimming pools near Pune and supplies pool pumps, sand filters and water treatment across India. Request a quote from our team.',
  site_url: '',
  ga_id: '',
  gsc_token: '',
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  youtube_url: '',
};

export const DEFAULT_BANNERS = [{
  id: 'default',
  eyebrow: 'FRP swimming pools, pool pumps and equipment',
  title: 'Cresta',
  subtitle: 'One-piece FRP swimming pools, and the pumps, filtration and treatment that keep them clear. Engineered in India by the Crystal Pools group.',
  image_path: '/img/site/hero-home.webp',
  image_alt: 'A calm indoor pool lined in warm timber, lit along its edge',
  cta_label: 'Explore pools',
  cta_url: '/frp-pools',
}];

export const CATEGORIES = [
  { id: 'filtration', name: 'Filtration', blurb: 'High-pressure sand filters for residential and commercial pools.', sort: 1 },
  { id: 'pumps', name: 'Pumps', blurb: 'Circulation pumps for every duty, from home pools to hotels.', sort: 2 },
  { id: 'treatment', name: 'Water Treatment', blurb: 'Chlorination, dosing and control for safe, balanced water.', sort: 3 },
  { id: 'cleaning', name: 'Cleaning & Maintenance', blurb: 'Vacuums, heads, brushes, poles and hoses for daily care.', sort: 4 },
  { id: 'accessories', name: 'Ladders & Fittings', blurb: 'Safety ladders, fittings and everyday pool accessories.', sort: 5 },
  { id: 'finishes', name: 'Tile Adhesive & Grout', blurb: 'Polymer-modified adhesives and grouts for glass mosaic and pool tiles.', sort: 6 },
  { id: 'wellness', name: 'Wellness', blurb: 'Jacuzzis, saunas and steam rooms, designed and installed by our team.', sort: 7 },
];

const p = (id, category_id, label, name, description, image, is_photo = false, pdf = null) => ({
  id, category_id, label, name, description,
  image_path: image ? `/img/${image}` : `/img/products/${id}.svg`, is_photo,
  datasheet_url: pdf ? request(`${name} datasheet`) : null,
});

export const PRODUCTS = [
  p('f-series', 'filtration', 'Commercial', 'F Series Sand Filters', 'Heavy-duty sand filters for high-capacity commercial pools.', null, false, 'f-series.pdf'),
  p('b-series', 'filtration', 'Commercial', 'B Series Filters', 'Horizontal filtration for large commercial pools.', null, false, 'b-series.pdf'),
  p('m-series', 'filtration', 'Residential', 'M Series Filters', 'Premium top-mount residential filtration systems.', null, false, 'm-series.pdf'),
  p('ms-series', 'filtration', 'Residential', 'MS Series Filters', 'Side-mount residential filtration systems.', null, false),
  p('mxb-series', 'pumps', 'Residential', 'MXB Series Pumps', 'Reliable performance for residential pools.', null, false, 'mxb-series.pdf'),
  p('mrb-series', 'pumps', 'Commercial', 'MRB Series Pumps', 'Heavy-duty flanged pumps for commercial duty.', null, false, 'mrb-series.pdf'),
  p('mtx-series', 'pumps', 'Compact', 'MTX Series Pumps', 'Compact, high-efficiency circulation.', null, false, 'mtx-series.pdf'),
  p('salt-chlorinator', 'treatment', 'Chlorination', 'Minderchlor Salt Chlorinator', 'Turns dissolved salt into chlorine for automated, silky-smooth sanitation.', null, false, 'minderchlor-salt-chlorinator.pdf'),
  p('tablet-feeder', 'treatment', 'Chlorination', 'Chemical Tablet Feeders', 'Consistent, regulated chlorine dispersion.', null, false, 'chemical-tablet-feeder.pdf'),
  p('dosingstar', 'treatment', 'Dosing', 'Dosingstar Dosing Pump', 'Precise, automated liquid chemical injection.', null, false, 'dosingstar-dosing-pump.pdf'),
  p('bp-series', 'treatment', 'Dosing', 'BP Series Dosing Pump', 'Reliable chemical dosing for balanced water.', null, false, 'bp-series.pdf'),
  p('hydrosmart', 'treatment', 'Control', 'Hydrosmart Pool System', 'Intelligent, centralised water-quality management.', null, false, 'hydrosmart-pool.pdf'),
  p('pool-vacuum', 'cleaning', 'Cleaning', 'Pool Vacuum', 'Efficient vacuuming for pool floors and walls.', null, false),
  p('ss-vacuum-head', 'cleaning', 'Commercial', 'Heavy-Duty SS Vacuum Head', 'Stainless steel vacuum head for commercial pools.', null, false),
  p('aluminium-vacuum-head', 'cleaning', 'Residential', 'Aluminium Vacuum Head', 'Lightweight aluminium head for residential use.', null, false),
  p('side-brush-head', 'cleaning', 'Cleaning', 'Vacuum Head with Side Brush', 'Vacuums and brushes in a single pass.', null, false),
  p('algae-brushes', 'cleaning', 'Cleaning', 'SS Algae Brushes', 'Stainless steel bristles for stubborn algae.', null, false),
  p('telescopic-poles', 'cleaning', 'Cleaning', 'Telescopic Poles', 'Grip-lock telescopic poles for all cleaning tools.', null, false),
  p('pool-hose', 'cleaning', 'Cleaning', 'Pool Hose', 'Durable, flexible hose for vacuum and cleaning systems.', null, false),
  p('ss-ladders', 'accessories', 'Safety', 'Stainless Steel Pool Ladders', 'Non-skid steps and secure handrails in rust-resistant SS — standard, in-pool and custom designs.', null, false),
  p('plastic-fittings', 'accessories', 'Fittings', 'Pool Plastic Fittings', 'Essential plastic fittings for pool plumbing systems.', null, false),
  p('pool-accessories', 'accessories', 'General', 'Test Kits & Pool Accessories', 'Water test kits and a full range of general-purpose pool accessories.', null, false),
  p('white-adhesive', 'finishes', 'Tile adhesive', 'Premium White Adhesive', 'Polymer-modified white adhesive for glass mosaic and pool tiles.', 'wellness/adhesive-1.webp', true),
  p('polymer-grout', 'finishes', 'Grout', 'Polymer-Modified Grout', 'Flexible, non-shrink grout for a permanent, watertight finish.', 'wellness/adhesive-2.webp', true),
  p('epoxy-grout', 'finishes', 'Grout', 'Epoxy Grout System', 'Hard-wearing epoxy grouting for demanding pool environments.', 'wellness/adhesive-3.webp', true),
  p('waterproofing', 'finishes', 'Waterproofing', 'Waterproofing Membrane', 'An impenetrable barrier that protects the structural shell.', 'wellness/adhesive-4.webp', true),
  p('jacuzzi', 'wellness', 'Hydrotherapy', 'Jacuzzis & Hydrotherapy Tubs', 'Hydro-massage tubs, built into your pool design or standalone, with a high degree of customisation.', 'wellness/jacuzzi-2.webp', true),
  p('sauna', 'wellness', 'Dry heat', 'Sauna Rooms', 'Bespoke enclosed wooden saunas using dry heat of 70–100 °C.', 'wellness/sauna.webp', true),
  p('steam-room', 'wellness', 'Wet heat', 'Steam Rooms', 'Modern glass-enclosed steam baths, designed and built for your space.', 'wellness/steam.webp', true),
].map((row, i) => ({ ...row, sort: i + 1, is_published: true }));

export const FRP_COLLECTIONS = [
  { id: 'classic', name: 'Classic', blurb: 'Rectangular, corner entry steps', sort: 1 },
  { id: 'linear', name: 'Linear', blurb: 'Long format, full-width steps', sort: 2 },
  { id: 'family', name: 'Family', blurb: 'With a shallow kids’ zone', sort: 3 },
  { id: 'signature', name: 'Signature', blurb: 'Roman-end entry steps', sort: 4 },
  { id: 'plunge', name: 'Plunge', blurb: 'Compact, with seating bench', sort: 5 },
  { id: 'round', name: 'Round Spa', blurb: 'Circular, with perimeter bench', sort: 6 },
];

// [collection, width ft, length ft]; round pools: [collection, diameter ft]
export const FRP_MODELS = [
  ['classic', 8, 16], ['classic', 8, 20], ['classic', 10, 16], ['classic', 10, 20], ['classic', 10, 30],
  ['linear', 10, 16], ['linear', 10, 28],
  ['family', 8, 20], ['family', 8, 24], ['family', 10, 20], ['family', 10, 25],
  ['signature', 8, 24], ['signature', 10, 20], ['signature', 10, 30],
  ['plunge', 8, 8], ['plunge', 8, 10],
  ['round', 6], ['round', 8], ['round', 10],
].map(([collection_id, width_ft, length_ft = null], i) => ({
  id: length_ft ? `${collection_id}-${width_ft}x${length_ft}` : `${collection_id}-${width_ft}d`,
  collection_id, width_ft, length_ft, sort: i + 1, is_published: true,
}));

export const DOWNLOADS = [
  ['frp-brochure', 'FRP Pool Brochure', 'Models, laminate & included equipment', 'frp-pool-brochure.pdf', 'brochure', true],
  ['f-series', 'F Series Sand Filters', 'Filtration', 'f-series.pdf', 'filtration', true],
  ['b-series', 'B Series Filters', 'Filtration', 'b-series.pdf', 'filtration', false],
  ['m-series', 'M Series Filters', 'Filtration', 'm-series.pdf', 'filtration', false],
  ['mxb-series', 'MXB Series Pumps', 'Pumps', 'mxb-series.pdf', 'pumps', true],
  ['mrb-series', 'MRB Series Pumps', 'Pumps', 'mrb-series.pdf', 'pumps', false],
  ['mtx-series', 'MTX Series Pumps', 'Pumps', 'mtx-series.pdf', 'pumps', false],
  ['salt-chlorinator', 'Salt Chlorinator', 'Water treatment', 'minderchlor-salt-chlorinator.pdf', 'treatment', true],
  ['tablet-feeder', 'Chemical Tablet Feeder', 'Water treatment', 'chemical-tablet-feeder.pdf', 'treatment', false],
  ['dosingstar', 'Dosingstar Dosing Pump', 'Water treatment', 'dosingstar-dosing-pump.pdf', 'treatment', false],
  ['bp-series', 'BP Series Dosing Pump', 'Water treatment', 'bp-series.pdf', 'treatment', false],
  ['hydrosmart', 'Hydrosmart Pool System', 'Water treatment', 'hydrosmart-pool.pdf', 'treatment', false],
  ['glass-mosaic', 'Glass Mosaic Catalogue', 'Tiles & finishes', 'glass-mosaic-catalogue.pdf', 'finishes', false],
  ['company-profile', 'Company Profile', 'Crystal Pools group', 'company-profile.pdf', 'company', false],
].map(([id, title, subtitle, file, category, featured], i) => ({
  id, title, subtitle, url: request(title, { brochure: 'frp', company: 'other' }[category] ?? 'equipment'), category, featured, sort: i + 1, is_published: true,
}));

export const ENQUIRY_TOPICS = [
  ['frp', 'FRP swimming pool'],
  ['equipment', 'Pumps & filtration'],
  ['treatment', 'Water treatment & dosing'],
  ['commercial', 'Commercial pool project'],
  ['wellness', 'Jacuzzi, sauna or steam room'],
  ['dealer', 'Dealer / distributor partnership'],
  ['service', 'Service & spares'],
  ['other', 'Something else'],
];
