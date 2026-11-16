import { Outlet } from "react-router-dom";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { LockedPanel } from "@/ui/LockedPanel";
import { PageHeader } from "@/ui/PageHeader";

/** For You is personal: guests and students not yet verified see what it offers and how to unlock it. */
export const ForYouGate = () => {
  const { access } = useSession();
  if (!isLimited(access)) return <Outlet />;
  return (
    <>
      <PageHeader title="For You" description="Your semester goals, weekly plan and progress." />
      <LockedPanel
        feature="For You"
        includes={[
          "Semester goals with a target, deadline and action steps",
          "A weekly plan for your own tasks, linked to your goals",
          "Progress check-ins and a history of how you're doing",
          "Events and resources matched to your goals and programme",
        ]}
      />
    </>
  );
};
