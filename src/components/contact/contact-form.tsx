"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ToastMessage } from "@/components/ui/toast-message";
import { buttonPrimary, inputBase } from "@/lib/ui";

const TOPICS = ["General", "Story tip", "Correction request", "Advertising", "Technical issue"] as const;

const MESSAGE_MAX = 2000;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name (at least 2 characters).")
    .max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  topic: z.enum(TOPICS, { errorMap: () => ({ message: "Choose a topic." }) }),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters.")
    .max(MESSAGE_MAX, `Message must be ${MESSAGE_MAX} characters or fewer.`),
  website: z.string(),
});

type ContactValues = z.infer<typeof contactSchema>;

const DEFAULT_VALUES: ContactValues = { name: "", email: "", topic: "General", message: "", website: "" };

function describedBy(...ids: Array<string | false | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="border-l-2 border-ink pl-2 text-sm text-ink">
      {message}
    </p>
  ) : null;
}

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });

  const messageLength = watch("message")?.length ?? 0;
  const control = (invalid: boolean) => clsx(inputBase, invalid ? "border-ink" : "border-border");

  async function onSubmit(values: ContactValues) {
    setSent(false);
    // Honeypot filled: almost certainly a bot. Report success and send nothing.
    if (values.website) {
      reset(DEFAULT_VALUES);
      setSent(true);
      return;
    }
    // No backend yet: there is no contact-messages table in this phase, so the message is not
    // stored or sent anywhere. The form validates and then shows the success state.
    reset(DEFAULT_VALUES);
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative flex flex-col gap-6">
      {sent ? (
        <ToastMessage tone="success" role="status" title="Message sent">
          Thank you. Our editors will reply within 2 working days.
        </ToastMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-name" className="text-sm font-semibold text-ink">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy(errors.name && "contact-name-error")}
            className={clsx(control(Boolean(errors.name)), "h-11")}
            {...register("name")}
          />
          <FieldError id="contact-name-error" message={errors.name?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="contact-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(errors.email && "contact-email-error")}
            className={clsx(control(Boolean(errors.email)), "h-11")}
            {...register("email")}
          />
          <FieldError id="contact-email-error" message={errors.email?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-topic" className="text-sm font-semibold text-ink">
          Topic
        </label>
        <select
          id="contact-topic"
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={describedBy(errors.topic && "contact-topic-error")}
          className={clsx(control(Boolean(errors.topic)), "h-11")}
          {...register("topic")}
        >
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
        <FieldError id="contact-topic-error" message={errors.topic?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-semibold text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={7}
          maxLength={MESSAGE_MAX}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("contact-message-count", errors.message && "contact-message-error")}
          className={clsx(control(Boolean(errors.message)), "py-3 leading-7")}
          {...register("message")}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldError id="contact-message-error" message={errors.message?.message} />
          <p id="contact-message-count" className="ml-auto shrink-0 text-sm text-muted">
            {messageLength} / {MESSAGE_MAX} characters
          </p>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech. Bots that fill it are silently ignored. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          {...register("website")}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className={clsx(buttonPrimary, "w-full sm:w-fit")}>
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
