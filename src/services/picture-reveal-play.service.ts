import type {
  GuessPictureRevealChoiceInput,
  OpenPictureRevealTileInput,
  PictureRevealSessionListQueryInput,
} from "@/lib/validations";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

/* eslint-disable @typescript-eslint/no-unused-vars */

export const PICTURE_REVEAL_PLAYER_TOKEN_COOKIE = "picture_reveal_player_token";

/**
 * Builds the compatibility error returned by removed session endpoints.
 *
 * @returns Service error with the legacy route removal status and message.
 */
function removedRouteError() {
  return new PictureRevealServiceError(
    410,
    "Picture reveal session routes have been removed. Use the host-run client flow instead.",
  );
}

/**
 * Preserves the removed create-session endpoint contract.
 *
 * @param _gameId - Legacy game id route parameter.
 * @param _playerToken - Legacy player token cookie value.
 * @returns Never resolves because the endpoint has been removed.
 * @throws PictureRevealServiceError with status 410 for compatibility.
 */
export async function createPictureRevealSession(
  _gameId: string,
  _playerToken: string | null,
): Promise<{ session: unknown; issuedPlayerToken: string | null }> {
  throw removedRouteError();
}

/**
 * Preserves the removed session-view endpoint contract.
 *
 * @param _gameId - Legacy game id route parameter.
 * @param _sessionId - Legacy session id route parameter.
 * @param _playerToken - Legacy player token cookie value.
 * @param _isAdmin - Whether the requester was an admin in the legacy flow.
 * @returns Never resolves because the endpoint has been removed.
 * @throws PictureRevealServiceError with status 410 for compatibility.
 */
export async function getPictureRevealSessionView(
  _gameId: string,
  _sessionId: string,
  _playerToken: string | null,
  _isAdmin: boolean,
): Promise<unknown> {
  throw removedRouteError();
}

/**
 * Preserves the removed open-tile endpoint contract.
 *
 * @param _gameId - Legacy game id route parameter.
 * @param _sessionId - Legacy session id route parameter.
 * @param _input - Legacy open-tile payload.
 * @param _playerToken - Legacy player token cookie value.
 * @returns Never resolves because the endpoint has been removed.
 * @throws PictureRevealServiceError with status 410 for compatibility.
 */
export async function openPictureRevealTile(
  _gameId: string,
  _sessionId: string,
  _input: OpenPictureRevealTileInput,
  _playerToken: string | null,
): Promise<unknown> {
  throw removedRouteError();
}

/**
 * Preserves the removed guess-choice endpoint contract.
 *
 * @param _gameId - Legacy game id route parameter.
 * @param _sessionId - Legacy session id route parameter.
 * @param _input - Legacy guess-choice payload.
 * @param _playerToken - Legacy player token cookie value.
 * @returns Never resolves because the endpoint has been removed.
 * @throws PictureRevealServiceError with status 410 for compatibility.
 */
export async function guessPictureRevealChoice(
  _gameId: string,
  _sessionId: string,
  _input: GuessPictureRevealChoiceInput,
  _playerToken: string | null,
): Promise<unknown> {
  throw removedRouteError();
}

/**
 * Preserves the removed admin session-history endpoint contract.
 *
 * @param _gameId - Legacy game id route parameter.
 * @param _query - Legacy admin session list filters.
 * @returns Never resolves because the endpoint has been removed.
 * @throws PictureRevealServiceError with status 410 for compatibility.
 */
export async function getAdminPictureRevealSessionHistory(
  _gameId: string,
  _query: PictureRevealSessionListQueryInput,
): Promise<unknown[]> {
  throw removedRouteError();
}
