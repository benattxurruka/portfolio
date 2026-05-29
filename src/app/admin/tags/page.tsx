import { getPhotos } from "@/lib/r2/photos";
import { getTagConfig } from "@/lib/r2/tagConfig";
import { mergeTagConfig } from "@/lib/utils/tagNormalization";
import { deriveTags } from "@/lib/utils/galleries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TagsManager } from "./TagsManager";

export const metadata = { title: "Admin — Tags" };
export const revalidate = 0;

export default async function AdminTagsPage() {
  const [photos, r2TagConfig] = await Promise.all([getPhotos(), getTagConfig()]);

  const tagConfig = mergeTagConfig(r2TagConfig);
  const allCanonicalTags = deriveTags(photos, tagConfig);

  // Tags detected in photos that have no entry in the config
  const untranslatedTags = allCanonicalTags.filter((tag) => !(tag in tagConfig));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <AdminHeader activeTab="tags" />

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink-primary mb-1">Tag translations</h1>
        <p className="text-sm text-ink-muted">
          Map multilingual tag variants (e.g. &quot;Catalunya&quot;, &quot;Cataluña&quot;, &quot;Catalonia&quot;) to a
          single canonical slug, and provide a display label for each language.
        </p>
      </div>

      <TagsManager tagConfig={tagConfig} untranslatedTags={untranslatedTags} />
    </div>
  );
}
