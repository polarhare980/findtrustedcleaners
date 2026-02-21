// src/app/blog/posts/end-of-tenancy-cleaning-checklist.js
export const meta = {
  title: "End of Tenancy Cleaning Checklist",
  description: "A practical end of tenancy cleaning checklist for tenants and landlords.",
};

export default function Post() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">End of Tenancy Cleaning Checklist</h1>
      <p className="text-gray-600 mb-6">
        Use this checklist to avoid deposit disputes and ensure the property is move-in ready.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Kitchen</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Oven, hob, extractor degreased and polished</li>
        <li>Fridge/freezer emptied, cleaned, and dried</li>
        <li>Worktops, cupboards, and handles wiped</li>
      </ul>
    </>
  );
}