import { relations } from "drizzle-orm";
import { accounts } from "./accounts";
import { pictureRevealGames } from "./picture-reveal-games";
import { pictureRevealImages } from "./picture-reveal-images";
import { sessions } from "./sessions";
import { soundGuessGames } from "./sound-guess-games";
import { soundGuessSounds } from "./sound-guess-sounds";
import { tierItems } from "./tier-items";
import { tierLists } from "./tier-lists";
import { users } from "./users";

export * from "./users";
export * from "./sessions";
export * from "./accounts";
export * from "./verifications";
export * from "./tier-lists";
export * from "./tier-items";
export * from "./picture-reveal-games";
export * from "./picture-reveal-images";
export * from "./sound-guess-games";
export * from "./sound-guess-sounds";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  tierLists: many(tierLists),
  pictureRevealGames: many(pictureRevealGames),
  soundGuessGames: many(soundGuessGames),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const tierListsRelations = relations(tierLists, ({ one, many }) => ({
  user: one(users, {
    fields: [tierLists.userId],
    references: [users.id],
  }),
  items: many(tierItems),
}));

export const tierItemsRelations = relations(tierItems, ({ one }) => ({
  tierList: one(tierLists, {
    fields: [tierItems.tierListId],
    references: [tierLists.id],
  }),
}));

export const pictureRevealGamesRelations = relations(
  pictureRevealGames,
  ({ one, many }) => ({
    user: one(users, {
      fields: [pictureRevealGames.userId],
      references: [users.id],
    }),
    images: many(pictureRevealImages),
  }),
);

export const pictureRevealImagesRelations = relations(
  pictureRevealImages,
  ({ one }) => ({
    game: one(pictureRevealGames, {
      fields: [pictureRevealImages.gameId],
      references: [pictureRevealGames.id],
    }),
  }),
);

export const soundGuessGamesRelations = relations(
  soundGuessGames,
  ({ one, many }) => ({
    user: one(users, {
      fields: [soundGuessGames.userId],
      references: [users.id],
    }),
    sounds: many(soundGuessSounds),
  }),
);

export const soundGuessSoundsRelations = relations(
  soundGuessSounds,
  ({ one }) => ({
    game: one(soundGuessGames, {
      fields: [soundGuessSounds.gameId],
      references: [soundGuessGames.id],
    }),
  }),
);
