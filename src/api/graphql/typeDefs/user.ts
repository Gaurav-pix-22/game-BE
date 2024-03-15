export default `
    type seedUpdateResponse {
        clientSeed: String!,
        hashedServerSeed: String!,
        nonce: Int,
        hashedNextServerSeed: String
    }

    type userSeed {
        clientSeed: String!,
        hashedServerSeed: String!,
        hashedNextServerSeed: String!,
        nonce: Int,
    }

    type serverSeed {
        serverSeed: String!,
    }

    union fairnessResp = diceAndLimboFairness | mineFairness | hiloFairness | diamondFairness | plinkoFairness | crashFairness | slideFairness | err

    type diceAndLimboFairness {
        gameCode: String!,
        outcome: Decimal
    }

    type crashFairness {
        gameCode: String!,
        crashAt: Decimal
    }

    type slideFairness {
        gameCode: String!,
        multiplier: Float
    }

    type mineFairness {
        gameCode: String!,
        mines: [Int]
    }

    type hiloOutcome {
        index: Int,
        card: String,
        rankValue: Int
    }

    type hiloFairness {
        gameCode: String!,
        cardOutcome: [hiloOutcome]
    }

    type diamondFairness {
        gameCode: String!,
        result: [String]
    }

    type plinkoFairness {
        gameCode: String!,
        state: plinkoState
        multiplier: Float
    }

    type validateUserSession {
        playerId: String!,
        balance: Decimal!,
        currency: String,
        language: String,
        gameMode: String
    }

    type addedHash {
        added: Boolean
    }

    type Query {
        getUserSeeds(userId: String!, token: String!): userSeed
        getServerSeed(hashedServerSeed: String!): serverSeed
    }

    type Mutation {
        validateUser(token: String!): validateUserSession
        createNewUser(userId: String!, token: String!, clientSeed: String!): seedUpdateResponse
        updateClientSeed(userId: String!, token: String!, clientSeed: String!): seedUpdateResponse
        verifyFairness(gameCode: String!, serverSeed: String, clientSeed: String, nonce: Int, mineCount: Int, risk: String, rows: Int, gameMode: String, hash: String, seed: String): fairnessResp
        generateHash(gameCode: String!, initialHash: String!): addedHash
    }
`;
