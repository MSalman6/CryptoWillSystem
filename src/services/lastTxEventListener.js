require("dotenv").config();
const Web3 = require("web3");
const willAbi = require("./willContractAbi.json");

const getWillContract = () => {
    const provider = new Web3(
        new Web3.providers.HttpProvider(process.env.REACT_APP_CHAIN_RPC),
        0,
        1
    );
    const account = provider.eth.accounts.privateKeyToAccount(
        process.env.REACT_APP_WILL_ADMIN_PK
    );
    provider.eth.accounts.wallet.add(account);
    provider.eth.defaultAccount = account.address;

    const willContract = new provider.eth.Contract(
        willAbi,
        process.env.REACT_APP_WILL_CONTRACT_ADDRESS
    );
    return { provider, willContract };
}

const checkWillStatus = async () => {
    console.log("[INFO] Checking for last transaction timestamp.")
    setInterval(async() => {
        const { provider, willContract } = getWillContract();
        const currWillIndex = await willContract.methods.willId().call();
        for (let i = 1; i <= currWillIndex; i++) {
            const willDetails = await willContract.methods.getWillDetails(i).call();
            const now = Math.round(new Date() / 1000);
            const claimableAfter = Number(process.env.REACT_APP_DAYS_AFTER_CLAIMABLE) * 24 * 60 * 60 * 1000;
            const claimableAt = Number((Number(willDetails.createdAt) * 1000) + claimableAfter) / 1000;
            if (!willDetails.claimed && now >= claimableAt) {
                await willContract.methods.setWillIsClaimableStatus(i, true).send({
                    from: provider.defaultAccount
                });
                console.log(`[INFO] Claimable set to true for willId: ${i}\n`);
            }
        }
    }, 60000);
}

module.exports = { checkWillStatus };
