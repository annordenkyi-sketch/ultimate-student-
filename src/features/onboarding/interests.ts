import {
  Activity,
  Briefcase,
  Cpu,
  Dumbbell,
  Gamepad2,
  MessageCircle,
  Microscope,
  Music,
  Palette,
  type LucideIcon,
} from "lucide-react";
import {
  FEATURE_IMAGES,
  MOSAIC_IMAGES,
  SECTION_IMAGES,
  type UnsplashImage,
} from "@/lib/images";

export interface InterestOption {
  label: string;
  icon: LucideIcon;
  photo: UnsplashImage;
  alt: string;
}

/** The 9 interests shown on /onboarding/living Part B. */
export const INTERESTS: InterestOption[] = [
  {
    label: "Sports",
    icon: Dumbbell,
    photo: FEATURE_IMAGES.interestSports,
    alt: "A group of men playing soccer on an outdoor pitch",
  },
  {
    label: "Music",
    icon: Music,
    photo: FEATURE_IMAGES.interestMusic,
    alt: "A crowd facing a lit concert stage",
  },
  {
    label: "Tech",
    icon: Cpu,
    photo: SECTION_IMAGES.opportunities,
    alt: "A student working on a laptop",
  },
  {
    label: "Research",
    icon: Microscope,
    photo: FEATURE_IMAGES.interestResearch,
    alt: "A scientist looking through a microscope in a lab",
  },
  {
    label: "Arts & culture",
    icon: Palette,
    photo: SECTION_IMAGES.social,
    alt: "A crowd of students at an outdoor event",
  },
  {
    label: "Debate",
    icon: MessageCircle,
    photo: MOSAIC_IMAGES[1],
    alt: "Students writing in notebooks during a lecture",
  },
  {
    label: "Career & internships",
    icon: Briefcase,
    photo: FEATURE_IMAGES.loginHero,
    alt: "A student working at a library",
  },
  {
    label: "Gaming",
    icon: Gamepad2,
    photo: FEATURE_IMAGES.interestGaming,
    alt: "Two people playing a video game with controllers",
  },
  {
    label: "Health & fitness",
    icon: Activity,
    photo: FEATURE_IMAGES.interestFitness,
    alt: "A group of runners on an athletics track",
  },
];

export const MIN_INTERESTS = 3;

export const findInterest = (label: string): InterestOption | undefined =>
  INTERESTS.find((i) => i.label === label);
