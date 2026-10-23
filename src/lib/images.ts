/**
 * Centralised Unsplash image URLs with per-image credit metadata.
 * Credits are listed in the Credits screen (/profile) as required by
 * https://unsplash.com/documentation#guidelines--crediting.
 */
import type { SectionId } from "@/data/types";

export interface UnsplashImage {
  id: string;
  /** The base photo id, used to build the URL. */
  photoId: string;
  alt: string;
  credit: { name: string; profile: string };
}

const UNSPLASH_BASE = "https://images.unsplash.com";

/** Build a sized Unsplash URL (format/crop/width/quality). */
export const unsplash = (photoId: string, w = 800, q = 70): string =>
  `${UNSPLASH_BASE}/${photoId}?auto=format&fit=crop&w=${w}&q=${q}`;

export const unsplashSrcSet = (photoId: string): string =>
  [400, 600, 800, 1200]
    .map((w) => `${unsplash(photoId, w)} ${w}w`)
    .join(", ");

// Section tile images (small photo-id strings use the standard
// `photo-{timestamp}-{hash}` format Unsplash serves on images.unsplash.com)
export const SECTION_IMAGES: Record<SectionId, UnsplashImage> = {
  academic: {
    id: "academic",
    photoId: "photo-1532012197267-da84d127e765",
    alt: "Open books stacked on a desk",
    credit: { name: "Ed Robertson", profile: "https://unsplash.com/@eddrobertson" },
  },
  navigation: {
    id: "navigation",
    photoId: "photo-1562774053-701939374585",
    alt: "A tall university library building at dusk",
    credit: { name: "Mikael Kristenson", profile: "https://unsplash.com/@mikael_k" },
  },
  accommodation: {
    id: "accommodation",
    photoId: "photo-1522708323590-d24dbb6b0267",
    alt: "A neatly made bed in a bright student room",
    credit: { name: "Spacejoy", profile: "https://unsplash.com/@spacejoy" },
  },
  services: {
    id: "services",
    photoId: "photo-1576091160399-112ba8d25d1f",
    alt: "A stethoscope on a clinic desk",
    credit: { name: "Online Marketing", profile: "https://unsplash.com/@impulsq" },
  },
  social: {
    id: "social",
    photoId: "photo-1540575467063-178a50c2df87",
    alt: "A crowd of students at an outdoor event, hands raised",
    credit: { name: "Nicholas Green", profile: "https://unsplash.com/@nickxshotz" },
  },
  opportunities: {
    id: "opportunities",
    photoId: "photo-1486312338219-ce68d2c6f44d",
    alt: "A student working on a laptop at a coffee shop",
    credit: { name: "Christin Hume", profile: "https://unsplash.com/@christinhumephoto" },
  },
};

/** Welcome / hero / feature photos used around the app. */
export const FEATURE_IMAGES = {
  welcomeHero: {
    id: "welcomeHero",
    photoId: "photo-1523050854058-8df90110c9f1",
    alt: "A graduating student throwing their cap in celebration",
    credit: { name: "Nathan Dumlao", profile: "https://unsplash.com/@nate_dumlao" },
  },
  campusGreeting: {
    id: "campusGreeting",
    photoId: "photo-1498243691581-b145c3f54a5a",
    alt: "A warm, sunlit view across a university campus courtyard",
    credit: { name: "Dom Fou", profile: "https://unsplash.com/@domlafou" },
  },
  onboardingAccount: {
    id: "onboardingAccount",
    photoId: "photo-1434030216411-0b793f4b4173",
    alt: "Students studying together with laptops",
    credit: { name: "Alexis Brown", profile: "https://unsplash.com/@alexisrbrown" },
  },
  onboardingType: {
    id: "onboardingType",
    photoId: "photo-1627556704290-2b1f5853ff78",
    alt: "A student walking through a campus corridor",
    credit: { name: "Kenny Eliason", profile: "https://unsplash.com/@neonbrand" },
  },
  onboardingLiving: {
    id: "onboardingLiving",
    photoId: "photo-1555854877-bab0e564b8d5",
    alt: "A tidy student bedroom with soft morning light",
    credit: { name: "R Architecture", profile: "https://unsplash.com/@rarchitecture_melbourne" },
  },
  onboardingInterests: {
    id: "onboardingInterests",
    photoId: "photo-1529333166437-7750a6dd5a70",
    alt: "A group of students laughing together outdoors",
    credit: { name: "Priscilla Du Preez", profile: "https://unsplash.com/@priscilladupreez" },
  },
  loginHero: {
    id: "loginHero",
    photoId: "photo-1741699428220-65f37f3fbbcb",
    alt: "A student studying at a library table with open books",
    credit: { name: "Zoshua Colah", profile: "https://unsplash.com/@zoshuacolah" },
  },
  onboardingTypeHero: {
    id: "onboardingTypeHero",
    photoId: "photo-1616428394230-ba242d33e3ba",
    alt: "Students walking on a university campus",
    credit: { name: "Jonah Brown", profile: "https://unsplash.com/@jonahbrown" },
  },
  onboardingTypeDefault: {
    id: "onboardingTypeDefault",
    photoId: "photo-1758270704464-f980b03b9633",
    alt: "Students looking at their phones in a lecture hall",
    credit: { name: "Vitaly Gariev", profile: "https://unsplash.com/@silverkblack" },
  },
  onboardingTypeNew: {
    id: "onboardingTypeNew",
    photoId: "photo-1758270704663-9d002a4b42a2",
    alt: "Two students looking at a smartphone in class",
    credit: { name: "Vitaly Gariev", profile: "https://unsplash.com/@silverkblack" },
  },
  interestMusic: {
    id: "interestMusic",
    photoId: "photo-1540039155733-5bb30b53aa14",
    alt: "A crowd of fans facing a brightly lit concert stage",
    credit: { name: "ActionVance", profile: "https://unsplash.com/@actionvance" },
  },
  interestSports: {
    id: "interestSports",
    photoId: "photo-1600077063877-22118d6290eb",
    alt: "A group of men playing soccer on an outdoor pitch",
    credit: { name: "Omar Ramadan", profile: "https://unsplash.com/@omarvellous14" },
  },
  interestResearch: {
    id: "interestResearch",
    photoId: "photo-1766297246931-7b861269dab0",
    alt: "A scientist looking through a microscope in a lab",
    credit: { name: "Chidera Faustina Okeke", profile: "https://unsplash.com/@thefourthwxll" },
  },
  interestGaming: {
    id: "interestGaming",
    photoId: "photo-1493711662062-fa541adb3fc8",
    alt: "Two people playing a video game with PlayStation controllers",
    credit: { name: "JESHOOTS.COM", profile: "https://unsplash.com/@jeshoots" },
  },
  interestFitness: {
    id: "interestFitness",
    photoId: "photo-1728060560980-e39712526b7a",
    alt: "A group of runners on an athletics track",
    credit: { name: "Selma DA SILVA", profile: "https://unsplash.com/@selmafaitdesphotos" },
  },
} as const;

/** Photos used in the Welcome page mosaic (all free Unsplash License). */
export const MOSAIC_IMAGES: UnsplashImage[] = [
  {
    id: "mosaic-grads",
    photoId: "photo-1769905226600-1d447fe7d020",
    alt: "Graduates in caps and gowns in an auditorium",
    credit: { name: "Blessfield John", profile: "https://unsplash.com/@blessfield" },
  },
  {
    id: "mosaic-lecture",
    photoId: "photo-1529390079861-591de354faf5",
    alt: "Two students writing in notebooks side by side",
    credit: { name: "Santi Vedrí", profile: "https://unsplash.com/@santivedri" },
  },
  {
    id: "mosaic-group-outside",
    photoId: "photo-1648301033733-44554c74ec50",
    alt: "A group of students sitting together outside a building",
    credit: { name: "Creab ThePolymath", profile: "https://unsplash.com/@cr_eab" },
  },
  {
    id: "mosaic-study-women",
    photoId: "photo-1761370981247-1dfd749ec96b",
    alt: "Three women reviewing study notes together indoors",
    credit: { name: "Muhammad-Taha Ibrahim", profile: "https://unsplash.com/@planeteelevene" },
  },
  {
    id: "mosaic-campus",
    photoId: "photo-1616428394230-ba242d33e3ba",
    alt: "Students on a university campus",
    credit: { name: "Jonah Brown", profile: "https://unsplash.com/@jonahbrown" },
  },
  // Re-use existing library photos
  FEATURE_IMAGES.welcomeHero,
  FEATURE_IMAGES.onboardingInterests,
  FEATURE_IMAGES.onboardingAccount,
  FEATURE_IMAGES.campusGreeting,
  SECTION_IMAGES.social,
];

/**
 * Photos used on the /onboarding/type page — swapped as the student picks
 * a type card. All free Unsplash License.
 */
export const TYPE_PHOTOS = {
  default: FEATURE_IMAGES.onboardingTypeDefault,
  prospective: FEATURE_IMAGES.onboardingTypeHero,
  new: FEATURE_IMAGES.onboardingTypeNew,
  continuing: MOSAIC_IMAGES[3], // Muhammad-Taha — three women reviewing notes
  postgraduate: FEATURE_IMAGES.loginHero, // Zoshua Colah — library
  "final-year": MOSAIC_IMAGES[0], // Blessfield John — graduates
} as const;

export const ALL_CREDITS: UnsplashImage[] = [
  ...Object.values(SECTION_IMAGES),
  ...Object.values(FEATURE_IMAGES),
  ...MOSAIC_IMAGES,
];
