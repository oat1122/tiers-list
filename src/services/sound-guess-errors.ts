export class SoundGuessServiceError extends Error {
  status: number;

  /**
   * Creates an HTTP-aware service error for sound guess route handlers.
   *
   * @param status - HTTP status code returned by the route boundary.
   * @param message - Safe error message returned to the caller.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = "SoundGuessServiceError";
    this.status = status;
  }
}

