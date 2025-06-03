import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as serviceAccount from '../../firebase-service-account.json';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount as admin.ServiceAccount),
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
