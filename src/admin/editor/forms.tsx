import { Paperclip, X } from "lucide-react";
import type { AnnouncementCategory, EventCategory, EventPayload, NewsPayload, ServiceCategory, ServicePayload } from "@/services";
import { Card, Field, SelectInput, TextArea, TextInput } from "../ui";
import { Checkbox, fid, HoursEditor, type FormProps } from "./fields";

const NEWS_CATEGORIES: AnnouncementCategory[] = ["Academic", "Campus life", "Finance", "Services"];
const EVENT_CATEGORIES: EventCategory[] = ["Careers", "Tech", "Sports", "Wellbeing", "Culture"];
const SERVICE_CATEGORIES: ServiceCategory[] = ["Study and IT", "Health", "Money"];

export const NewsForm = ({ value: v, onChange, errors }: FormProps<NewsPayload>) => (
  <Card title="News details">
    <div className="space-y-4">
      <TextInput id={fid("title")} label="Title" required value={v.title} onChange={(e) => onChange({ title: e.target.value })} error={errors.title} maxLength={120} />
      <TextInput id={fid("summary")} label="Short summary" required value={v.summary} onChange={(e) => onChange({ summary: e.target.value })} hint="One sentence shown in lists and search." error={errors.summary} maxLength={200} />
      <TextArea id={fid("body")} label="Body" required rows={7} value={v.body} onChange={(e) => onChange({ body: e.target.value })} hint="Leave a blank line between paragraphs." error={errors.body} />
      <SelectInput id={fid("category")} label="Category" value={v.category} onChange={(e) => onChange({ category: e.target.value as AnnouncementCategory })}>
        {NEWS_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectInput>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id={fid("link")} type="url" label="Link (optional)" placeholder="https://" value={v.link} onChange={(e) => onChange({ link: e.target.value })} error={errors.link} />
        <Field id={fid("attachment")} label="Attachment (optional)" hint="Students see the file name. In this demo the file itself isn't uploaded.">
          {v.attachmentName ? (
            <div className="flex items-center gap-2 rounded-md border border-oxford-ink/25 bg-white px-2.5 py-1.5 text-sm">
              <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{v.attachmentName}</span>
              <button type="button" onClick={() => onChange({ attachmentName: "" })} className="rounded p-0.5 hover:bg-oxford-cream" aria-label={`Remove attachment ${v.attachmentName}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <input id={fid("attachment")} type="file" accept=".pdf,.doc,.docx" onChange={(e) => onChange({ attachmentName: e.target.files?.[0]?.name ?? "" })} className="block w-full text-sm file:mr-2 file:rounded-md file:border file:border-oxford-ink/20 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold" />
          )}
        </Field>
      </div>
    </div>
  </Card>
);

export const EventForm = ({ value: v, onChange, errors, reference }: FormProps<EventPayload>) => (
  <Card title="Event details">
    <div className="space-y-4">
      <TextInput id={fid("title")} label="Title" required value={v.title} onChange={(e) => onChange({ title: e.target.value })} error={errors.title} maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput id={fid("category")} label="Category" value={v.category} onChange={(e) => onChange({ category: e.target.value as EventCategory })}>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectInput>
        <TextInput id={fid("organiser")} label="Organiser" required value={v.organiser} onChange={(e) => onChange({ organiser: e.target.value })} error={errors.organiser} />
      </div>
      <TextArea id={fid("description")} label="Description" required rows={5} value={v.description} onChange={(e) => onChange({ description: e.target.value })} hint="Leave a blank line between paragraphs." error={errors.description} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput id={fid("date")} type="date" label="Date" required value={v.date} onChange={(e) => onChange({ date: e.target.value })} error={errors.date} />
        <TextInput id={fid("start")} type="time" label="Starts" required value={v.start} onChange={(e) => onChange({ start: e.target.value })} error={errors.start} />
        <TextInput id={fid("end")} type="time" label="Ends" required value={v.end} onChange={(e) => onChange({ end: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          id={fid("venue")}
          label="Venue on the campus map"
          required
          value={v.placeId}
          onChange={(e) => onChange({ placeId: e.target.value })}
          hint="Picked from Places, so students get walking directions."
          error={errors.venue}
        >
          <option value="">Not on the map</option>
          {reference.places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectInput>
        <TextInput id={fid("venueName")} label="Venue name or room (optional)" value={v.venue} onChange={(e) => onChange({ venue: e.target.value })} hint="Shown instead of the place name, e.g. “Great Hall, main auditorium”." />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Checkbox id={fid("registration")} checked={v.registration} onChange={(registration) => onChange({ registration })} label="Students must register" />
        {v.registration && (
          <div className="w-40">
            <TextInput id={fid("capacity")} type="number" min={1} label="Capacity" required value={v.capacity} onChange={(e) => onChange({ capacity: e.target.value })} error={errors.capacity} />
          </div>
        )}
      </div>
    </div>
  </Card>
);

export const ServiceForm = ({ value: v, onChange, errors, reference }: FormProps<ServicePayload>) => (
  <Card title="Service details">
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <TextInput id={fid("name")} label="Name" required value={v.name} onChange={(e) => onChange({ name: e.target.value })} error={errors.name} />
        <TextInput id={fid("shortName")} label="Short name (optional)" value={v.shortName} onChange={(e) => onChange({ shortName: e.target.value })} hint="For small screens." />
      </div>
      <SelectInput id={fid("category")} label="Category" value={v.category} onChange={(e) => onChange({ category: e.target.value as ServiceCategory })}>
        {SERVICE_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectInput>
      <TextInput id={fid("summary")} label="Short summary" required value={v.summary} onChange={(e) => onChange({ summary: e.target.value })} error={errors.summary} maxLength={200} />
      <TextArea id={fid("description")} label="What it does" required rows={5} value={v.description} onChange={(e) => onChange({ description: e.target.value })} error={errors.description} />
      <HoursEditor rows={v.hours} onChange={(hours) => onChange({ hours })} emptyNote="No hours: students see “Available any time” (for online services)." />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id={fid("contact")} type="tel" label="Phone" value={v.phone} onChange={(e) => onChange({ phone: e.target.value })} error={errors.contact} hint="A phone number or an email is required." />
        <TextInput id={fid("email")} type="email" label="Email" value={v.email} onChange={(e) => onChange({ email: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput id={fid("placeId")} label="Location" value={v.placeId} onChange={(e) => onChange({ placeId: e.target.value })} hint="Picked from Places.">
          <option value="">Online only, no building</option>
          {reference.places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectInput>
        <TextInput id={fid("website")} type="url" label="Official link (optional)" placeholder="https://" value={v.website} onChange={(e) => onChange({ website: e.target.value })} error={errors.website} />
      </div>
    </div>
  </Card>
);
