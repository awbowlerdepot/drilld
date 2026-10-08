import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

/** Browser origins that upload and view files directly (with URLs the API signs). */
const APP_ORIGINS = [
    'https://app.drilld.io',
    'https://main.d1fijf3mjtco4q.amplifyapp.com',
    'http://localhost:3000'
];

/**
 * The private files bucket (customer attachments: photos and scans of paper
 * drill sheets). Nothing is public and there are no Cognito storage rules:
 * the API decides who may see what (row-level security on
 * customer_attachment) and hands out short-lived presigned URLs, with keys
 * under companies/<company id>/. Production keeps the bucket if the stack is
 * removed; a sandbox's bucket goes with it.
 */
export const defineFileStorage = (stack: Stack, options: { protect: boolean }) => {
    const bucket = new s3.Bucket(stack, 'FilesBucket', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        versioned: options.protect,
        removalPolicy: options.protect ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        autoDeleteObjects: !options.protect,
        cors: [{
            allowedOrigins: APP_ORIGINS,
            allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
            allowedHeaders: ['Content-Type'],
            maxAge: 3600
        }],
        lifecycleRules: [
            // A deleted file stays recoverable (production keeps versions) for 30 days.
            { noncurrentVersionExpiration: Duration.days(30) },
            { abortIncompleteMultipartUploadAfter: Duration.days(1) }
        ]
    });
    return { bucket };
};
