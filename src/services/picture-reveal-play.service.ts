import type {
  GuessPictureRevealChoiceInput,
  OpenPictureRevealTileInput,
  PictureRevealSessionListQueryInput,
} from "@/lib/validations";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

/* eslint-disable @typescript-eslint/no-unused-vars */

export const PICTURE_REVEAL_PLAYER_TOKEN_COOKIE = "picture_reveal_player_token";

function removedRouteError() {
  return new PictureRevealServiceError(
    410,
    "Picture reveal session routes have been removed. Use the host-run client flow instead.",
  );
}

export async function createPictureRevealSession(
  _gameId: string,
  _playerToken: string | null,
): Promise<{ session: unknown; issuedPlayerToken: string | null }> {
  throw removedRouteError();
}

export async function getPictureRevealSessionView(
  _gameId: string,
  _sessionId: string,
  _playerToken: string | null,
  _isAdmin: boolean,
): Promise<unknown> {
  throw removedRouteError();
}

export async function openPictureRevealTile(
  _gameId: string,
  _sessionId: string,
  _input: OpenPictureRevealTileInput,
  _playerToken: string | null,
): Promise<unknown> {
  throw removedRouteError();
}

export async function guessPictureRevealChoice(
  _gameId: string,
  _sessionId: string,
  _input: GuessPictureRevealChoiceInput,
  _playerToken: string | null,
): Promise<unknown> {
  throw removedRouteError();
}

export async function getAdminPictureRevealSessionHistory(
  _gameId: string,
  _query: PictureRevealSessionListQueryInput,
): Promise<unknown[]> {
  throw removedRouteError();
}
