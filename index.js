const crypto = require("crypto")
const PokerEvaluator = require("poker-evaluator")
const holeCards = require("./hole-cards")

/** ***************************************** **/
/** Deck Constants and Helper                 **/
/** ***************************************** **/

const fullDeck = [
    "As", "Ks", "Qs", "Js", "Ts", "9s", "8s", "7s", "6s", "5s", "4s", "3s", "2s",
    "Ah", "Kh", "Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h",
    "Ac", "Kc", "Qc", "Jc", "Tc", "9c", "8c", "7c", "6c", "5c", "4c", "3c", "2c",
    "Ad", "Kd", "Qd", "Jd", "Td", "9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d"
];

const deckWithoutHoleCards = (theHoleCards) => {
    return fullDeck.filter(card => !theHoleCards.includes(card))
}

const getRandomCardsFrom = (deck, n) => {
    var result = new Array(n),
        len = deck.length,
        taken = new Array(len);
    while (n--) {
        var x = Math.floor(Math.random() * len)
        result[n] = deck[x in taken ? taken[x] : x]
        taken[x] = --len in taken ? taken[len] : len
    }
    return result;
}

const getCryptoRandomCardsFrom = (deck, n) => {
    var result = new Array(n),
        len = deck.length,
        taken = new Array(len);
    while (n--) {
        var x = crypto.randomInt(0, len)
        result[n] = deck[x in taken ? taken[x] : x]
        taken[x] = --len in taken ? taken[len] : len
    }
    return result
}

const allHoleCardTypes = Object.keys(holeCards.types)

/** ***************************************** **/
/** Results Helpers                           **/
/** ***************************************** **/

const results = {}
allHoleCardTypes.forEach(holeCardsType => {
    results[holeCardsType] = {
        hole: holeCardsType,
        played: 0,
        won: 0,
        tied: 0,
        lost: 0,
    }
})

/** ***************************************** **/
/** Command line args                         **/
/** ***************************************** **/

if (!process.argv[2]) {
    console.log("ERROR: Supply a number of simulations.")
    process.exit(1)
}

const playsOfEachHoleCardType = Number(process.argv[2])

if (isNaN(playsOfEachHoleCardType) || playsOfEachHoleCardType < 1) {
    console.log("ERROR: Number of simulations must be greater than 0.")
    process.exit(2)
}

/** ***************************************** **/
/** Run the simulation                        **/
/** ***************************************** **/

allHoleCardTypes.forEach(holeCardsType => {
    const playerHoleCards = holeCards.types[holeCardsType]

    const remainingDeck = deckWithoutHoleCards(playerHoleCards)
    if (remainingDeck.length != 50) {
        throw new Error("Deck should have 50 cards after hole cards have been removed")
    }

    // Simulate n hands
    for (let i = 0; i < playsOfEachHoleCardType; i += 1) {
        // First 5 cards are Board 
        const opponentHand = getCryptoRandomCardsFrom(remainingDeck, 7)
        const playerHand = playerHoleCards.concat(opponentHand.slice(0, 5))

        const opponentHandEval = PokerEvaluator.evalHand(opponentHand)
        const playerHandEval = PokerEvaluator.evalHand(playerHand)

        // console.log("Player Hand:" + playerHand + ` [${playerHandEval.handName}]`)
        // console.log("Opponent Hand:" + opponentHand + ` [${opponentHandEval.handName}]`)

        results[holeCardsType].played = results[holeCardsType].played + 1
        if (playerHandEval.handType > opponentHandEval.handType) {
            results[holeCardsType].won = results[holeCardsType].won + 1
        } else if (playerHandEval.handType < opponentHandEval.handType) {
            results[holeCardsType].lost = results[holeCardsType].lost + 1
        } else { // Hand types are equal
            if (playerHandEval.handRank > opponentHandEval.handRank) {
                results[holeCardsType].won = results[holeCardsType].won + 1
            } else if (playerHandEval.handRank < opponentHandEval.handRank) {
                results[holeCardsType].lost = results[holeCardsType].lost + 1
            } else { // Hand types and hand ranks are equal
                results[holeCardsType].tied = results[holeCardsType].tied + 1
            }
        }
    }
})

/** ***************************************** **/
/** Tabulate Results                          **/
/** ***************************************** **/

const sortedResults = Object.keys(results).map(key => {
    return results[key]
}).sort((a, b) => {
    // Sort highest winners first
    if (a.won > b.won) {
        return -1
    } else if (a.won < b.won) {
        return 1
    }

    // Same wins, sort on ties
    if (a.tied > b.tied) {
        return -1
    } else if (a.tied < b.tied) {
        return 1
    }

    // Same wins and same ties
    return 0
})

console.log("Hole\tPlays\tWon\tTied\tLost\t|\tWin%\tTie%\tLoss%")
sortedResults.forEach(result => {
    const { hole, played, won, tied, lost } = result
    const winPerc = 100 * won / played
    const tiePerc = 100 * tied / played
    const lostPerc = 100 * lost / played
    console.log(`${hole}\t${played}\t${won}\t${tied}\t${lost}\t|\t${winPerc}\t${tiePerc}\t${lostPerc}`)
})
