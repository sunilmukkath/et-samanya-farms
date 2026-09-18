export const site = {
  name: "ET Samanya Farms",
  shortName: "Samanya",
  legalName: "ET Samanya Foods Private Limited",
  slogan: "Making farming cool again.",
  tagline: "A little earth. A lot of heart.",
  description:
    "ET Samanya Farms grows everyday food — vegetables, sesame, urad, spinach, fruit — among more than 1,600 trees, with a pond, solar irrigation, and room for people to come back to the land.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://etsamanyafarms.com",
  email: "hello@etsamanyafarms.com",
  phoneDisplay: "+91 98408 50057",
  phoneHref: "tel:+919840850057",
  acres: 5,
  treesPlanted: 1600,
  founded: 2022,
  landPurchased: 2021,
  cin: "U10799TN2025PTC176110",
  location: {
    street: "East Street",
    village: "Thenkulapakkam",
    taluk: "Tindivanam",
    district: "Villupuram",
    state: "Tamil Nadu",
    pincode: "604304",
    country: "India",
    address: "East Street, Thenkulapakkam, Tamil Nadu 604304",
    mapsUrl: "https://maps.app.goo.gl/1ZGEidMpQMhU6jTAA",
    lat: 12.1123294,
    lng: 79.6467758,
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/farm", label: "The farm" },
    { href: "/harvest", label: "Harvest" },
    { href: "/practices", label: "Practices" },
    { href: "/visit", label: "Visit & enquire" },
  ],
} as const;

export const aims = [
  {
    title: "Grow our own food",
    body: "A kitchen that starts in the field — vegetables, greens, pulses, oilseed, and fruit from the same five acres.",
  },
  {
    title: "Keep a living balance",
    body: "Trees, crops, water, and people on one plot. Agroforestry so the land earns and the canopy stays.",
  },
  {
    title: "Build a knowledge bank",
    body: "Traditional practice, new tools, and what this soil actually teaches — written down, shared, improved.",
  },
  {
    title: "Make farming cool again",
    body: "Pull skill and attention back to the village. Growing food is work worth wanting.",
  },
] as const;

export const harvest = [
  {
    slug: "vegetables",
    tamil: "காய்கறி",
    name: "Vegetables",
    season: "Horticulture patch",
    note: "A dedicated vegetable farm on the plot — picked for the table, not for a catalogue.",
    photo: "/photos/gourd-vine.jpg",
    photoAlt: "Ash gourd vine with young fruit on the beds",
  },
  {
    slug: "spinach",
    tamil: "கீரை",
    name: "Spinach",
    season: "Solo crop",
    note: "Everyday greens. The keerai that goes into the pot before anyone photographs it.",
  },
  {
    slug: "sesame",
    tamil: "எள்",
    name: "Sesame",
    season: "Solo crop",
    note: "Oilseed grown as a field crop among the trees — the til that belongs in a Tamil kitchen.",
    photo: "/photos/sesame.jpg",
    photoAlt: "Sesame pods on the plant",
  },
  {
    slug: "urad",
    tamil: "உளுந்து",
    name: "Urad dal",
    season: "Solo crop",
    note: "Black gram on the solo-crop ground. Protein for the pot, and a crop that is kind to the soil.",
    photo: "/photos/seedlings.jpg",
    photoAlt: "Young pulse plants coming up in dark soil",
  },
  {
    slug: "fruit",
    tamil: "பழம்",
    name: "Fruit",
    season: "Orchard and beds",
    note: "Watermelon, passion fruit, and fruit trees among the 1,600 — food from the canopy and from the ground.",
    photo: "/photos/watermelon.jpg",
    photoAlt: "A watermelon ripening in the grass",
  },
  {
    slug: "trees",
    tamil: "மரம்",
    name: "Timber & medicinal trees",
    season: "Always",
    note: "A mix of timber, medicinal, and fruit trees. The farm is a food place that still makes room for canopy.",
    photo: "/photos/tree-leaves.jpg",
    photoAlt: "A young tree with broad leaves",
  },
] as const;

export const gallery = [
  { src: "/photos/pond.jpg", alt: "The donut pond at sundown", caption: "Sensei pond" },
  { src: "/photos/sesame.jpg", alt: "Sesame pods on the plant", caption: "Sesame" },
  { src: "/photos/watermelon.jpg", alt: "A watermelon in the grass", caption: "Watermelon" },
  { src: "/photos/gourd-vine.jpg", alt: "Ash gourd vine on the plot", caption: "Gourd vine" },
  { src: "/photos/solar.jpg", alt: "Solar panels on the farm", caption: "Solar irrigation" },
  { src: "/photos/planting.jpg", alt: "Planting a sapling together", caption: "Planting" },
  { src: "/photos/passion-flower.jpg", alt: "A passion-fruit flower", caption: "Passion flower" },
  { src: "/photos/tending-vines.jpg", alt: "Tending the gourd vines", caption: "In the beds" },
  { src: "/photos/harvest-work.jpg", alt: "Threshing a dried harvest on the plot", caption: "Harvest day" },
] as const;

export const landUnits = [
  { label: "Trees", share: "28%" },
  { label: "Solo crops", share: "18%" },
  { label: "Walk-paths & open ground", share: "15%" },
  { label: "Pond", share: "15%" },
  { label: "Animal husbandry", share: "10%" },
  { label: "Horticulture", share: "8%" },
  { label: "House, store, tank", share: "6%" },
] as const;

export const journey = [
  {
    year: "2021",
    title: "Land",
    body: "Five acres bought in November. Planning started before the first fence went in.",
  },
  {
    year: "2022",
    title: "Landscaping",
    body: "Fence, pond, and canals — to hold water, lift the water table, and give the plot a shape.",
  },
  {
    year: "2023",
    title: "Solar irrigation",
    body: "Solar pump and drip. First 800 trees in the ground.",
  },
  {
    year: "2024",
    title: "More trees",
    body: "Local farmers helped plant the next wave of trees and plants. The stand is now more than 1,600.",
  },
  {
    year: "2025",
    title: "Livestock & stay",
    body: "Cattle, a farmhouse, and better tools — the next layer of an integrated farm.",
  },
] as const;

export const practices = [
  {
    title: "Site, then design",
    body: "Read the landscape, climate, soil, and what already lives here. Zone the plot so high-care work sits close to people, and the rest of the land can breathe.",
  },
  {
    title: "Soil and water",
    body: "Compost and mulch for the ground. Rain, swales, canals, and a deep pond so water stays on the farm instead of leaving overnight.",
  },
  {
    title: "Trees with crops",
    body: "Agroforestry: timber, medicinal, and fruit trees among vegetables and solo crops. Canopy, yield, and soil in the same year.",
  },
  {
    title: "Nutrients that cycle",
    body: "Compost and vermiculture return what the harvest took. Animals, when they come, work as fertility and pest control — not as decoration.",
  },
  {
    title: "Learn in public",
    body: "Work with the village. Stay flexible. Write down what works. Farming here is a knowledge bank, not a finished recipe.",
  },
] as const;

export const enquireInterests = [
  { value: "produce", label: "Fresh produce" },
  { value: "visit", label: "Visit, walk, or workshop" },
  { value: "trees", label: "Trees & planting" },
  { value: "grow", label: "Grow my own food" },
  { value: "other", label: "Something else" },
] as const;
