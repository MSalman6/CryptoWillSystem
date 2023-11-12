const Web3 = require("web3");
const willAbi = require("./willContractAbi.json");
const BigNumber = require("bignumber.js");
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const handleTransactionError = (err) => {
    if (err.message.toLowerCase().includes("user denied transaction")) {
        return alert("Transaction denied");
    }
}

const getWillContract = (provider) => {
    const contract = new provider.eth.Contract(
        willAbi,
        process.env.REACT_APP_WILL_CONTRACT_ADDRESS
    );
    return contract;
}

const createWill = async (provider, account, benificiaries, amounts) => {
    if (!provider) return alert("Please connect your wallet!");
    const willContract = getWillContract(provider);
    const totalAmount = amounts.reduce((acc, val) => BigNumber(acc).plus(val), 0);
    console.log(totalAmount.toString())
    try {
        return await willContract.methods.createWill(benificiaries, amounts).send({
            from: account,
            value: totalAmount.toString()
        })
    } catch(err) {
        handleTransactionError(err);
        return false;
    }
}

const setWillIsClaimable = async (willId, status) => {
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

    const willContract = getWillContract(provider);

    try {
        const receipt = await willContract.methods.setWillIsClaimableStatus(willId, status).send({ from: account.address });
        console.log(`[INFO] Successfully set will${willId} status${status}\n`);
        return true;
    } catch (err) {
        console.log(`[ERROR] Couldn't set will${willId} claimable status:`, err, "\n");
        return false;
    }
}

const getPreviousWills = async(account, provider) => {
    if (!provider) return;
    const willContract = getWillContract(provider);
    const wills = await willContract.methods.getTestatorWillIds(account).call();
    
    let willDetails = [];

    await Promise.all(wills.map(async (willId) => {
        const details = await getWillDetails(provider, willId);
        willDetails.push(details);
    }));

    return willDetails;
}

const getWillDetails = async(provider, willId) => {
    const willContract = getWillContract(provider);
    return await willContract.methods.getWillDetails(willId).call();
}

const getClaimableWillIds = async(account, provider) => {
    if (!provider) return;
    const willContract = getWillContract(provider);
    const wills = await willContract.methods.getClaimableWillsIds(account).call();

    let willDetails = [];

    await Promise.all(wills.map(async (willId) => {
        const details = await getWillDetails(provider, willId);
        willDetails.push({...details, willId});
    }));

    return willDetails;
}

const claimWill = async(account, provider, willId) => {
    if (!provider) return;
    const willContract = getWillContract(provider);
    try {
        return await willContract.methods.claimWill(willId).send({
            from: account
        })
    } catch(err) {
        handleTransactionError(err);
    }
}

module.exports = {
    createWill,
    getWillContract,
    setWillIsClaimable,
    getClaimableWillIds,
    getPreviousWills,
    claimWill
}