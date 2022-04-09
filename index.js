const web3 = require("@solana/web3.js")
const inquirer = require("inquirer")
const figlet = require('figlet')

/**
 * Welcome Screen
 */
figlet('Welcome to SolBet', (err, data) => {
    if (err) {
        console.error('something went wrong')
    } else {
        console.log(data)
    }
})


/**
 * Address of the user betting
 */
let from;

/**
 * Address of the organizer
 */
const to = web3.Keypair.generate()

/**
 * Gets the balance of the user betting
 */
const getBalance = async () => {
    try {
        console.log('\n Loading account...')
        const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed')
        const balance = await connection.getBalance(from.publicKey)
        console.log('\n \n \n Your wallet balance is:', balance / web3.LAMPORTS_PER_SOL, 'SOL')
    } catch (err) {
        console.warn(err)
    }
}

/**
 * Airdrops to the user betting
 */
const airDrop = async () => {
    try {
        const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed')
        let airdrop = await connection.requestAirdrop(from.publicKey, web3.LAMPORTS_PER_SOL)
        console.log('successfully airdropped 1SOL with txn', airdrop);
    } catch (err) {
        console.warn(err)
    }
}

/**
 * Generates a random(1~10) number for betting
 */
const randomGenerator = () => {
    let random = Math.random() * 10
    return random.toFixed()
}


/**
 * Removes 0.1SOL from the looser's account
 */
const transferSOL = async (to, transferAmt) => {
    try {
        const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
        const transaction = new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: new web3.PublicKey(from.publicKey),
                toPubkey: new web3.PublicKey(to.publicKey),
                lamports: transferAmt * web3.LAMPORTS_PER_SOL
            })
        )
        try {
            const signature = await web3.sendAndConfirmTransaction(
                connection,
                transaction,
                [from]
            )
            console.log('signing transaction:', signature)
            return signature;
        } catch (err) {
            console.log('No fund')
        }

    } catch (err) {
        console.log(err);
    }
}

const askAgain = [{
    type: 'confirm',
    name: 'again',
    message: 'Want to run program again',
    default: true
}]

const entrypoint = [{
    type: 'confirm',
    name: 'wallet',
    message: 'Do you have a wallet address',
    default: false
}, ]

const wallet = [{
    type: 'input',
    name: 'address',
    message: 'Input your  wallet secret key'
}, ]

const number = [{
    type: 'input',
    name: 'number',
    message: 'Input your  Guess from 1~10'
}, ]

const questions = [{
    type: 'list',
    name: 'actions',
    message: 'Select an action',
    choices: ['airdrop', 'play', 'balance', 'address'],
}, ]

/**
 * CLI for betting
 */
function ask() {
    inquirer.prompt(entrypoint).then((answer) => {
        if (answer.wallet) {
            inquirer.prompt(wallet).then((address) => {
                try {
                    from = web3.Keypair.generate()
                    console.log('New Address is ', from.publicKey.toBase58())
                } catch (err) {
                    console.log("Invalid address")
                }

                actions()
            })

        } else {
            from = web3.Keypair.generate()
            console.log('Generated', from.publicKey.toBase58())
            actions()
        }
    })


}


function actions() {
    inquirer.prompt(questions).then((answer) => {

        if (answer.actions == 'address') {
            console.log(from.publicKey.toBase58())
            again()
        }

        if (answer.actions == 'airdrop') {
            airDrop()
            again()
        }
        if (answer.actions == 'balance') {
            getBalance(from.publicKey.toBase58())
            again()
        }
        if (answer.actions == 'play') {
            inquirer.prompt(number).then((number) => {
                let generated = randomGenerator()
                if (number.number == generated) {
                    console.log('Actual number is', generated)
                    console.log('But you guessed ', number.number)
                    console.log('You won 1SOL check balance')
                    airDrop()
                    again()
                } else {
                    console.log('Actual number is', generated)
                    console.log('But you guessed ', number.number)
                    console.log('You loosed 0.1SOL check balance')
                    transferSOL(to, 0.1)
                    again()
                }
            })
        }

    })


}

function again() {
    inquirer.prompt(askAgain).then((again) => {
        if (again.again) {
            actions()
        }
    })
}


ask()
