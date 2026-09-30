import { dictionaries, Locale } from "@/lib/i18n/dictionaries";
import { formatINR, formatDate } from "@/lib/formatters";

export function formatReminderMessage(
  guardian: string,
  student: string,
  amountPaise: number,
  dueDate: Date | string,
  locale: Locale = "en"
): string {
  const dict = dictionaries[locale] || dictionaries.en;
  const template = dict.reminders.template;
  const amountStr = formatINR(amountPaise);
  const dateStr = formatDate(dueDate);

  return template
    .replace("{guardian}", guardian)
    .replace("{student}", student)
    .replace("{amount}", amountStr)
    .replace("{date}", dateStr);
}
