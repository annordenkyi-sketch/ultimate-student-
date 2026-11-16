import { Navigate } from "react-router-dom";
import { entryRouteFor } from "@/session/access";
import { useSession } from "@/session/SessionProvider";

/** "Open Ultimate Student" in flow 00: routes by sign-in, verification and setup. */
export const EntryGate = () => {
  const { access } = useSession();
  return <Navigate to={entryRouteFor(access)} replace />;
};
