import { Injectable, OnModuleInit } from '@nestjs/common';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

interface FirebaseCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!getApps().length) {
      const credentials = JSON.parse(
        process.env.FIREBASE_CREDENTIALS!,
      ) as FirebaseCredentials;

      console.log('Initializing Firebase Admin SDK with credentials:', {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
      });

      initializeApp({
        credential: cert({
          projectId: credentials.project_id,
          clientEmail: credentials.client_email,
          privateKey: credentials.private_key.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const bucket = getStorage().bucket();
    const file = bucket.file(`proof/${Date.now()}_${filename}`);
    await file.save(buffer, {
      metadata: { contentType: mimetype },
      public: true,
    });

    return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  }
}
