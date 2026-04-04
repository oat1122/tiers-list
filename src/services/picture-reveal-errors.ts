export class PictureRevealServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PictureRevealServiceError";
    this.status = status;
  }
}
