import type { AccountService } from "../types";
import { db, toPublic, wait } from "./db";

export const mockAccountService: AccountService = {
  async update(accountId, patch) {
    await wait(700);
    return toPublic(db.update(accountId, patch));
  },
};
