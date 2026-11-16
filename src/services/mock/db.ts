import { storage } from "@/lib/storage";
import type { StudentAccount } from "../types";

/** Mock-only: an account plus its password, as a backend would store it. */
export interface StoredAccount extends StudentAccount {
  password: string;
}

export const TEST_PASSWORD = "Password1";

export const SEED_ACCOUNTS: StoredAccount[] = [
  {
    id: "stu-ama",
    name: "Ama Mensah",
    email: "ama.mensah@st.ug.edu.gh",
    studentId: "10012345",
    password: TEST_PASSWORD,
    studyLevel: "undergraduate",
    verification: "verified",
    setupComplete: true,
    coursesSetUp: true,
    academic: { departmentId: "computer-science", programmeId: "bsc-computer-science", level: "Level 300" },
    lastVerification: null,
  },
  {
    id: "stu-kofi",
    name: "Kofi Boateng",
    email: "kofi.boateng@st.ug.edu.gh",
    studentId: "10023456",
    password: TEST_PASSWORD,
    studyLevel: "undergraduate",
    verification: "verified",
    setupComplete: false,
    coursesSetUp: false,
    academic: { departmentId: "economics", programmeId: "ba-economics", level: "Level 200" },
    lastVerification: null,
  },
  {
    id: "stu-esi",
    name: "Esi Owusu",
    email: "esi.owusu@gmail.com",
    password: TEST_PASSWORD,
    studyLevel: "undergraduate",
    verification: "unverified",
    setupComplete: false,
    coursesSetUp: false,
    academic: null,
    lastVerification: null,
  },
  {
    id: "stu-yaw",
    name: "Yaw Asante",
    email: "yaw.asante@gmail.com",
    studentId: "10070002",
    password: TEST_PASSWORD,
    studyLevel: "postgraduate",
    verification: "pending",
    setupComplete: false,
    coursesSetUp: false,
    academic: null,
    lastVerification: {
      identifier: "10070002",
      result: "pending",
      checkedAt: "2026-11-10T09:30:00.000Z",
    },
  },
];

const ACCOUNTS_KEY = "us.v3.accounts";

const load = (): StoredAccount[] =>
  storage.get<StoredAccount[] | null>(ACCOUNTS_KEY, null) ?? SEED_ACCOUNTS.map((a) => ({ ...a }));

const save = (accounts: StoredAccount[]) => storage.set(ACCOUNTS_KEY, accounts);

export const db = {
  findByIdentifier(identifier: string): StoredAccount | undefined {
    const id = identifier.trim().toLowerCase();
    return load().find((a) => a.email.toLowerCase() === id || a.studentId === id);
  },
  findById(id: string): StoredAccount | undefined {
    return load().find((a) => a.id === id);
  },
  insert(account: StoredAccount): void {
    save([...load(), account]);
  },
  update(id: string, patch: Partial<StoredAccount>): StoredAccount {
    const accounts = load();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Unknown account ${id}`);
    const next = { ...accounts[idx]!, ...patch };
    accounts[idx] = next;
    save(accounts);
    return next;
  },
};

export const toPublic = (stored: StoredAccount): StudentAccount => {
  const { password, ...account } = stored;
  void password;
  return account;
};

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
