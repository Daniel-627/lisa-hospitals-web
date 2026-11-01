import axios from "axios";
import { uploadsApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

/** Uploads one chat attachment straight to Cloudinary (private) and returns its link. The server decides folder and types. */
export async function uploadChatFile(file: File): Promise<{ url: string; name: string }> {
  let s;
  try { s = (await uploadsApi.sign("chat_file")).data.data; } catch (e) { throw new Error(errMsg(e, "File upload isn't available right now.")); }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!s.formats.includes(ext)) throw new Error(`Choose a ${s.formats.map((f: string) => f.toUpperCase()).join(", ")} file.`);
  if (file.size > s.maxBytes) throw new Error(`The file is too large. The limit is ${Math.round(s.maxBytes / 1024 / 1024)} MB.`);
  const form = new FormData();
  Object.entries(s.fields).forEach(([k, v]) => form.append(k, String(v)));
  form.append("file", file);
  // Plain axios: our sign-in token must never go to Cloudinary.
  const res = await axios.post(s.uploadUrl, form);
  const url = res.data?.secure_url;
  if (typeof url !== "string") throw new Error("The upload did not finish. Please try again.");
  return { url, name: file.name };
}
