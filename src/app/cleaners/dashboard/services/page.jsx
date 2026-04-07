import { redirect } from "next/navigation";

export default function CleanerServicesEntryPage() {
  redirect('/cleaners/dashboard?section=services');
}
