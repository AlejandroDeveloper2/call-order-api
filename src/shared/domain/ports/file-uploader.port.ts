export interface FileUploaderPort<T, R> {
  uploadFile: (file: T, folder?: string) => Promise<R>;
}
