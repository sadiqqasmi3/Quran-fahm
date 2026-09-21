export interface StoredObject {
  key: string;
  contentType: string;
  byteLength: number;
  checksum: string;
}

export interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
  checksum: string;
  visibility: "public" | "private";
}

export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StoredObject>;
  get(key: string): Promise<Uint8Array | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  signUpload(key: string, expiresInSeconds: number): Promise<URL>;
  signDownload(key: string, expiresInSeconds: number): Promise<URL>;
}
