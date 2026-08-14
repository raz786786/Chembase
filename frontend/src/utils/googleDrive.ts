import { supabase } from '../supabaseClient';

/**
 * Retrieves the Google provider_token from the active Supabase session.
 * This token is required to make REST calls to Google APIs.
 */
export async function getGoogleProviderToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.error("No active session found:", error);
    return null;
  }
  
  // provider_token is returned during OAuth sign in
  const token = session.provider_token;
  if (!token) {
    console.warn("No Google provider_token found. Make sure the user signed in with Google.");
    return null;
  }
  
  return token;
}

/**
 * Uploads a text/blob file directly to the user's Google Drive.
 * Requires the `https://www.googleapis.com/auth/drive.file` scope.
 * 
 * @param filename Name of the file in Google Drive
 * @param content The string content (e.g., CSV, JSON) to upload
 * @param mimeType The MIME type (e.g., 'text/csv', 'application/json')
 * @returns Google Drive file ID if successful
 */
export async function uploadToGoogleDrive(filename: string, content: string, mimeType: string = 'text/plain'): Promise<string | null> {
  const token = await getGoogleProviderToken();
  if (!token) {
    throw new Error("Missing Google Provider Token. User must be signed in with Google.");
  }

  // Use multipart upload to upload metadata and content simultaneously
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const metadata = {
    name: filename,
    mimeType: mimeType
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n\r\n' +
    content +
    close_delim;

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Drive Upload Failed:", errText);
      throw new Error(`Google API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id; // Return the created file ID
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw error;
  }
}
