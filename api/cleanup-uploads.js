import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;

if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: "Unauthorized" });
}

    const now = Date.now();
    const eightHoursMs = 8 * 60 * 60 * 1000;

    const { data: requests, error: requestError } = await supabaseAdmin
      .from("patient_requests")
      .select("id, appointment_slot_id, uploaded_files, upload_status")
      .not("appointment_slot_id", "is", null);

    if (requestError) {
      throw requestError;
    }

    if (!requests || requests.length === 0) {
      return res.status(200).json({ checked: 0, deleted: 0 });
    }

    const slotIds = requests.map(r => r.appointment_slot_id).filter(Boolean);

    const { data: slots, error: slotError } = await supabaseAdmin
      .from("appointment_slots")
      .select("id, start_time")
      .in("id", slotIds);

    if (slotError) {
      throw slotError;
    }

    const slotMap = new Map(slots.map(slot => [slot.id, slot]));

    let deletedCount = 0;

    for (const request of requests) {
      const slot = slotMap.get(request.appointment_slot_id);
      if (!slot || !slot.start_time) continue;

      const appointmentTime = new Date(slot.start_time).getTime();
      const dueForDeletion = appointmentTime + eightHoursMs <= now;

      if (!dueForDeletion) continue;

            let paths = [];

      const files = Array.isArray(request.uploaded_files)
        ? request.uploaded_files
        : [];

      paths = files
        .map(file => file.path)
        .filter(Boolean);

      if (paths.length === 0 && request.appointment_slot_id) {
        const { data: storageFiles, error: listError } = await supabaseAdmin.storage
          .from("patient-documents")
          .list("uploads/" + request.appointment_slot_id);

        if (listError) {
          console.error("Storage list error:", listError);
          continue;
        }

        paths = (storageFiles || []).map(file =>
          "uploads/" + request.appointment_slot_id + "/" + file.name
        );
      }

      if (paths.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
          .from("patient-documents")
          .remove(paths);

        if (removeError) {
          console.error("Storage delete error:", removeError);
          continue;
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from("patient_requests")
        .update({
          upload_status: "deleted_after_appointment",
          uploaded_files_deleted_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (updateError) {
        console.error("Update error:", updateError);
        continue;
      }

      deletedCount++;
    }

    return res.status(200).json({
      checked: requests.length,
      deleted: deletedCount
    });
  } catch (err) {
    console.error("Cleanup failed:", err);
    return res.status(500).json({ error: err.message });
  }
}