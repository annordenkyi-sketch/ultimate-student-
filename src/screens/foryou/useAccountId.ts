import { useSession } from "@/session/SessionProvider";

/** The signed-in student's id. For You screens only render behind ForYouGate, so there is one. */
export const useAccountId = (): string => {
  const { account } = useSession();
  if (!account) throw new Error("For You needs a signed-in student");
  return account.id;
};
