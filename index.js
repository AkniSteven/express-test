const express = require('express');
const {Account} = require('@near-js/accounts');
const {UnencryptedFileSystemKeyStore} = require('@near-js/keystores-node');
const {JsonRpcProvider} = require('@near-js/providers');
const {InMemorySigner} = require('@near-js/signers');
const os = require('os');
const path = require('path');
const BN = require('bn.js');
const nearAPI = require('near-api-js');


const { actionCreators } = require('@near-js/transactions');
const { signedDelegate, transfer } = actionCreators;

const app = express();
const port = 3000;

app.use(express.json());

app.post('/test-transfer', async (req, res) => {
    try {
        const {senderAccountId} = req.body;
        const networkId = 'mainnet';
        const providerUrl = 'https://rpc.mainnet.near.org';
        const credentialsPath = '.near-credentials';
        const senderAccount = initializeAccount(networkId, providerUrl, credentialsPath, senderAccountId);
        const contract = new nearAPI.Contract(
            senderAccount,
            'testrest.near',
            {
                changeMethods: ['test_transaction_event']
            }
        );
        const result = await contract.test_transaction_event({
            args: {text: 'test'},
            gas: 300000000000000
        }).catch(error => {
            console.error('Error:', error);
            throw error;
        });
        res.json({success: true, result});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});


app.post('/test-transfer-delegated', async (req, res) => {
    try {
        const { senderAccountId, signerAccountId } = req.body;

        const networkId = 'mainnet';
        const providerUrl = 'https://rpc.mainnet.near.org';
        const credentialsPath = '.near-credentials';

        const senderAccount = initializeAccount(networkId, providerUrl, credentialsPath, senderAccountId);
        const signerAccount = initializeAccount(networkId, providerUrl, credentialsPath, signerAccountId);

        // const contract = new nearAPI.Contract(
        //     senderAccount,
        //     'testrest.near',
        //     {
        //         changeMethods: ['test_transaction_event']
        //     }
        // );

        const delegateAction = actionCreators.functionCall('test_transaction_event', { text: 'test' });
        const delegate = await signerAccount.signedDelegate({
            actions: [delegateAction],
            blockHeightTtl: 60,
            receiverId: senderAccount.accountId,
        });

        console.log(delegate);

        const result = await signerAccount.signAndSendTransaction({
            actions: [delegate.delegateAction],
            receiverId: delegate.delegateAction.receiverId,
        });

        res.json({ success: true, result });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function initializeAccount(networkId, providerUrl, credentialsPath, accountId) {
    return new Account({
        networkId,
        provider: new JsonRpcProvider({url: providerUrl}),
        signer: new InMemorySigner(new UnencryptedFileSystemKeyStore(path.join(os.homedir(), credentialsPath))),
    }, accountId);
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
