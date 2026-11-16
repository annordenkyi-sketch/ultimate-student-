import { services } from "@/services";
import { greetingFor, longDate, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { DashCard, LoadError, Skeleton } from "@/ui/DashCard";
import { EventsCard, NewsCard, QuickActions } from "./ContentCards";
import { NextLectureCard, SetupCoursesCard, TodaySchedule } from "./LectureCards";
import { SyncNotice } from "./SyncNotice";

/** Flow 03 Home dashboard. Guests and unverified students see public content only. */
export const HomeScreen = () => {
  const { account, access } = useSession();
  const now = useNow(30_000);
  const limited = isLimited(access);
  const accountId = account?.id;
  const showLectures = !limited && Boolean(account?.coursesSetUp);

  const { state: timetable, reload } = useAsync(
    () => (showLectures && accountId ? services.timetable.get(accountId) : Promise.resolve(null)),
    [accountId, showLectures],
  );

  const firstName = !limited ? (account?.preferredName || account?.name.split(" ")[0]) : undefined;

  return (
    <>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oxford-mute">{longDate(now)}</p>
        <h1 className="mt-1 text-3xl font-medium md:text-4xl">
          {greetingFor(now)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      {access === "full" && <SyncNotice />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {!limited && account && (
          <>
            {!showLectures ? (
              <SetupCoursesCard className="lg:col-span-3" />
            ) : timetable.status === "loading" ? (
              <DashCard id="next-lecture-title" title="Next lecture" className="lg:col-span-3">
                <Skeleton lines={2} />
              </DashCard>
            ) : timetable.status === "error" ? (
              <DashCard id="next-lecture-title" title="Next lecture" className="lg:col-span-3">
                <LoadError what="your timetable" onRetry={reload} />
              </DashCard>
            ) : timetable.data ? (
              <>
                <NextLectureCard courses={timetable.data.courses} now={now} className="lg:col-span-2" />
                <TodaySchedule courses={timetable.data.courses} now={now} />
              </>
            ) : (
              <SetupCoursesCard className="lg:col-span-3" />
            )}
            <QuickActions className="lg:col-span-3" />
          </>
        )}
        <NewsCard now={now} className="lg:col-span-2" />
        <EventsCard now={now} />
      </div>
    </>
  );
};
