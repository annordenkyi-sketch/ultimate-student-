import type { Session } from "../types";
import { SEED_ACCOUNTS, toPublic } from "./db";

export interface MockScenario {
  id: string;
  label: string;
  description: string;
  session: Session;
}

const signedInAs = (id: string): Session => {
  const account = SEED_ACCOUNTS.find((a) => a.id === id);
  if (!account) throw new Error(`Missing seed account ${id}`);
  return { status: "signedIn", account: toPublic(account) };
};

/** Every branch of flow 00, as a session you can switch to while testing. */
export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: "signed-out",
    label: "Signed out",
    description: "Opens the landing page. Can continue as a guest.",
    session: { status: "signedOut" },
  },
  {
    id: "unverified",
    label: "Signed in, not verified",
    description: "Esi Owusu. Limited access, asked to verify.",
    session: signedInAs("stu-esi"),
  },
  {
    id: "pending",
    label: "Signed in, verification pending",
    description: "Yaw Asante. Limited access while under review.",
    session: signedInAs("stu-yaw"),
  },
  {
    id: "setup-incomplete",
    label: "Verified, setup not finished",
    description: "Kofi Boateng. Sent to resume onboarding.",
    session: signedInAs("stu-kofi"),
  },
  {
    id: "ready",
    label: "Verified, setup finished",
    description: "Ama Mensah. Full access to the main application.",
    session: signedInAs("stu-ama"),
  },
];

export const scenarioIdFor = (session: Session): string => {
  if (session.status === "signedOut") return "signed-out";
  const { verification, setupComplete } = session.account;
  if (verification === "unverified") return "unverified";
  if (verification === "pending") return "pending";
  return setupComplete ? "ready" : "setup-incomplete";
};
