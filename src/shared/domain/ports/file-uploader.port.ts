export abstract class FileUploaderPort<T, R> {
  abstract uploadFile: (file: T, folder?: string) => Promise<R>;
}

export const FILE_UPLOADER = Symbol('FILE_UPLOADER');
