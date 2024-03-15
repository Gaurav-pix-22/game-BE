export type seedHistory = {
  clientSeed: string;
  serverSeed: string;
  hashedServerSeed: string;
  nonce: number;
};

export interface UserInterface {
  _id?: string;
  userId: string;
  clientSeed: string;
  serverSeed: string;
  hashedServerSeed: string;
  nextServerSeed: string;
  hashedNextServerSeed: string;
  seedHistory: Record<string, seedHistory>;
  nonce: number;
}

export interface addOrUpdateUserInterface {
  userId: string;
  token: string;
  clientSeed: string;
}

export interface getServerSeedInterface {
  hashedServerSeed: string;
}

export interface getUserSeedsInterface {
  userId: string;
  token: string;
}

export interface InitSchemaInterface {
  token: string;
}