/**
 * Moves photos stored in the database (submissions.image_data, a base64 data
 * URL) to Supabase Storage, with a thumbnail each. Run once, after applying
 * supabase/schema.sql (which creates the bucket and the photo_path column):
 *
 *   npm run photos:move-to-storage              lists what it would move
 *   npm run photos:move-to-storage -- --apply   moves them
 *
 * Safe to run again: submissions already moved are skipped. Photos are
 * served the same way before and after, so the app works throughout.
 */
import { supabase } from "@/server/db";
import { storePhoto } from "@/server/photos";

const apply = process.argv.includes("--apply");

async function main() {
  const { data: rows, error } = await supabase
    .from("submissions")
    .select("id")
    .not("image_data", "is", null)
    .is("photo_path", null);
  if (error) throw error;

  console.log(
    `${rows.length} photo(s) to move${apply ? "" : " (dry run: add --apply to move them)"}`,
  );
  let moved = 0;
  let failed = 0;

  // One at a time: each photo is read, re-encoded and uploaded in full
  for (const { id } of rows) {
    const { data: row, error: readError } = await supabase
      .from("submissions")
      .select("image_data")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    const sizeKb = Math.round((row.image_data?.length ?? 0) / 1024);

    if (!apply) {
      console.log(`  would move ${id} (${sizeKb} KB)`);
      continue;
    }

    try {
      const photoPath = await storePhoto(id, row.image_data);
      const { error: updateError } = await supabase
        .from("submissions")
        .update({ photo_path: photoPath, image_data: null })
        .eq("id", id)
        .is("photo_path", null);
      if (updateError) throw updateError;
      moved++;
      console.log(`  moved ${id} (${sizeKb} KB)`);
    } catch (moveError) {
      failed++;
      console.error(`  couldn't move ${id}:`, moveError);
    }
  }

  if (apply) console.log(`Done: ${moved} moved, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  // Not process.exit(): exiting while sharp's threads shut down crashes Node on Windows
  process.exitCode = 1;
});
