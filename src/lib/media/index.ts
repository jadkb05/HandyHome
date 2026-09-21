export type StoredMedia = {
  mediaKey: string;
  url?: string;
};

export type MediaStorage = {
  readonly providerName: string;
};

export class MediaStorageNotSelectedError extends Error {
  constructor() {
    super("Media storage provider is not locked (OPEN_QUESTIONS T-03).");
    this.name = "MediaStorageNotSelectedError";
  }
}

export function getMediaStorage(): MediaStorage {
  throw new MediaStorageNotSelectedError();
}
