/**
 * Client-side R2 helpers. Credentials live on the backend; the browser only
 * talks to our API for presigned URLs, then PUTs directly to R2.
 */

export function isR2UploadEnabled() {
	// Uploads go through the authenticated backend. Always attempt that path;
	// callers fall back to data URLs only when the API reports R2 is unset.
	return true;
}
