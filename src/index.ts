import express from 'express';
import { Account } from '@near-js/accounts';
import { UnencryptedFileSystemKeyStore } from '@near-js/keystores-node';
import { JsonRpcProvider } from '@near-js/providers';
import { InMemorySigner } from '@near-js/signers';
import os from 'os';
import path from 'path';
import { Contract } from 'near-api-js';
import { actionCreators, encodeSignedDelegate } from '@near-js/transactions';
import { submitTransaction } from './mb-ai-bos/utils/near/meta-transactions';
import { signDelegatedTransaction } from './mb-ai-bos/utils/near/sign-delegated';
import { deserialize } from 'borsh';
import { SCHEMA } from "./mb-ai-bos/utils/near/types/schema";
import BN from "bn.js";


const app = express();
const port = 3003;

app.use(express.json());

app.post('/test-transfer', async (req, res) => {
  try {
    const {senderAccountId} = req.body;
    const networkId = 'mainnet';
    const providerUrl = 'https://rpc.mainnet.near.org';
    const credentialsPath = '.near-credentials';
    const senderAccount = initializeAccount(networkId, providerUrl, credentialsPath, senderAccountId);
    // @ts-ignore
    const contract = new Contract(
      senderAccount,
      'testrest.near',
      {
        changeMethods: ['test_transaction_event']
      }
    );
    // @ts-ignore
    const result = await contract.test_transaction_event({
      args: {text: 'test'},
      gas: 300000000000000,
    }).catch((error: Error) => {
      console.error('Error:', error);
      throw error;
    });
    res.json({success: true, result});
  } catch (error) {
    res.status(500).json({success: false, error: (error as Error).message});
  }
});

app.post('/test-transfer-delegated', async (req, res) => {
  try {
    const {senderAccountId, signerAccountId} = req.body;

    const networkId = 'mainnet';
    const providerUrl = 'https://rpc.mainnet.near.org';
    const credentialsPath = '.near-credentials';

    const senderAccount = initializeAccount(networkId, providerUrl, credentialsPath, senderAccountId);
    const signerAccount = initializeAccount(networkId, providerUrl, credentialsPath, signerAccountId);

    // const delegateFromLib = await signDelegatedTransaction({
    //   network: 'mainnet',
    //   contractAddress: 'testrest.near',
    //   privateKey: 'ed25519:GV6fsvAeDzgcPHoiXyRdBjojB7AK8Ue11ZrFex1cx1yuRwV6gf5h8LaN7tv7fSLvT53Fi3cJqpdAyocSywgx1aE',
    //   signer: senderAccount.accountId,
    //   sg: senderAccount,
    //   transaction: {args: JSON.stringify([{"text": "test"}]), deposit: 0, gas: 3000000000000, methodName: 'test_transaction_event'}
    // })


    const delegateAction = actionCreators.functionCall(
      'test_transaction_event',
      { text: 'test' },
      new BN("3000000000000"),
      new BN("0")
    );
    const delegate = await signerAccount.signedDelegate({
      actions: [delegateAction],
      blockHeightTtl: 60,
      receiverId: signerAccountId,
    });


    const result = await submitTransaction({network: 'mainnet', delegate: delegate});

    res.json({success: true, result});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({success: false, error: (error as Error).message});
  }
});

function initializeAccount(networkId: string, providerUrl: string, credentialsPath: string, accountId: string) {
  // @ts-ignore
  return new Account({
    networkId,
    provider: new JsonRpcProvider({url: providerUrl}),
    signer: new InMemorySigner(new UnencryptedFileSystemKeyStore(path.join(os.homedir(), credentialsPath))),
  }, accountId);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
