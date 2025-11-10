// /api/_google.ts
import { google } from "googleapis";

function loadCreds() {
  const b64 = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || "";
  if (!b64) throw new Error("Missing GOOGLE_CLOUD_CREDENTIALS_BASE64");
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json);
}

export function getGoogleAuth() {
  const creds = loadCreds();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets"
    ],
  });
  return auth;
}
