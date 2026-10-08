import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// The private files bucket (amplify/storage). Every key is under the
// company's prefix, so a key built here can only point at that company's files.

const s3 = new S3Client({});
const URL_SECONDS = 15 * 60;

const bucket = () => {
    const name = process.env.FILES_BUCKET;
    if (!name) throw new Error('Missing environment variable FILES_BUCKET');
    return name;
};

export const attachmentKey = (companyId: string, customerId: string, attachmentId: string) =>
    `companies/${companyId}/customers/${customerId}/attachments/${attachmentId}`;

/** A URL the browser PUTs the file to. Content type and length are signed, so the upload must match them. */
export const uploadUrl = (key: string, contentType: string, sizeBytes: number) =>
    getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: sizeBytes }), {
        expiresIn: URL_SECONDS,
        // Without this the presigner leaves them unsigned and S3 would take any file.
        signableHeaders: new Set(['content-type', 'content-length'])
    });

/** A URL to view the file in the browser (inline, under its original name). */
export const viewUrl = (key: string, fileName: string) =>
    getSignedUrl(s3, new GetObjectCommand({
        Bucket: bucket(),
        Key: key,
        ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
    }), { expiresIn: URL_SECONDS });

/** The stored file's size and type, or null if nothing was uploaded. */
export const storedFile = async (key: string): Promise<{ sizeBytes: number; contentType: string | undefined } | null> => {
    try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
        return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType };
    } catch (error) {
        if ((error as { name?: string }).name === 'NotFound') return null;
        throw error;
    }
};

export const deleteFiles = async (keys: string[]) => {
    for (let i = 0; i < keys.length; i += 1000) {
        await s3.send(new DeleteObjectsCommand({
            Bucket: bucket(),
            Delete: { Objects: keys.slice(i, i + 1000).map(Key => ({ Key })), Quiet: true }
        }));
    }
};
