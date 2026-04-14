export class PictureRevealServiceError extends Error {
  status: number;

  /**
   * Creates an HTTP-aware service error for picture reveal route handlers.
   *
   * @param status - HTTP status code returned by the route boundary.
   * @param message - Safe error message returned to the caller.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = "PictureRevealServiceError";
    this.status = status;
  }
}
