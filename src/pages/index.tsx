import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useConnect, useAccount, useNetwork, useContract } from 'wagmi';
import { plonk } from 'snarkjs';
import Alert from '../components/Alert';
import { poseidon } from 'circomlibjs'; // v0.0.8
import { getIdentityTreeData, getReputationTreeData, login } from '../api';
import { buildMerkleTree } from '../utils';

export const useIsMounted = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
};

export default function Home() {
  const [{ data, error }, connect] = useConnect();
  const MetaMaskConnector = data.connectors[0];
  const [{ data: accountData }, disconnect] = useAccount();
  const [{ data: networkData, error: networkError, loading }, switchNetwork] =
    useNetwork();
  const isMounted = useIsMounted();
  const [alertText, setAlertText] = useState('');
  const [alertType, setAlertType] = useState('');
  const [statusIdentityProof, setStatusIdentityProof] = useState('not started');
  const [statusReputationProof, setStatusReputationProof] =
    useState('not started');
  const [alertHidden, setAlertHidden] = useState(true);
  const [userSecret, setUserSecret] = useState('');
  const [userPubAddress, setUserPubAddress] = useState('');
  const [loginStatus, setLoginStatus] = useState(false);

  const MerkleTreeContractAddress =
    process.env.NEXT_PUBLIC_ALETHEIA_CONTRACT_ADDRESS;

  const formatTimeStamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    if (timestamp == 0) {
      return 'not updated since last refresh';
    }
    return date.toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onLogin = async () => {
    const reputationTreeData = await getReputationTreeData();
    const reputationTree = buildMerkleTree(
      reputationTreeData.attestation1Leaves
    );

    const identityTreeData = await getIdentityTreeData();
    const identityTree = buildMerkleTree(identityTreeData.identityLeaves);

    console.log('identityTree: ', identityTree);
    console.log('reputationTree: ', reputationTree);

    // create identity
    // const secret = ethers.utils.formatBytes32String(userSecret);
    const identityCommitment = poseidon([userPubAddress, userSecret]);

    console.log(userSecret, userPubAddress);
    console.log(identityCommitment.toString());

    // find index of leaves in both trees
    const indexReputationLeaf = reputationTree.indexOf(userPubAddress);
    const indexIdentityLeaf = identityTree.indexOf(
      identityCommitment.toString()
    );

    console.log('indexIdentityLeaf: ', indexIdentityLeaf);
    console.log('indexReputationLeaf: ', indexReputationLeaf);

    // generate proves for both trees
    const identityProof = identityTree.createProof(indexIdentityLeaf);
    const reputationProof = reputationTree.createProof(indexReputationLeaf);

    console.log('pubAddr: ', userPubAddress);
    console.log('secret: ', userSecret);
    console.log('identityProof:', identityProof);
    console.log('reputationProof: ', reputationProof);

    const inputReputationProof = {
      leaf: userPubAddress,
      pathIndices: reputationProof.pathIndices,
      siblings: reputationProof.siblings.map((elm) => elm.toString()),
    };
    console.log('Input Reputation Proof: ', inputReputationProof);

    // generate ZK proof for reputation Merkle Tree
    setStatusReputationProof('Proof is being generated...');
    const { proof: proofReputation, publicSignals: publicSignalsReputation } =
      await plonk.fullProve(
        inputReputationProof,
        '/zk/reputation/ReputationTree.wasm',
        '/zk/reputation/ReputationTree_final.zkey'
      );

    setStatusReputationProof('Proof was created succesfully.');
    // setStatusReputationProof('Proof is being verified...');
    // backend call verify proof
    console.log('Public Signal Reputation: ', publicSignalsReputation);
    console.log('Public Proof: ', proofReputation);

    // generate ZK proof for identity Merkle Tree
    const inputIdentityProof = {
      password: userSecret,
      publicAddr: userPubAddress,
      pathIndices: identityProof.pathIndices,
      siblings: identityProof.siblings.map((elm) => elm.toString()),
    };

    setStatusIdentityProof('Proof is being generated...');
    const { proof: proofIdentity, publicSignals: publicSignalsIdentity } =
      await plonk.fullProve(
        inputIdentityProof,
        '/zk/identity/IdentityTree.wasm',
        '/zk/identity/IdentityTree_final.zkey'
      );
    setStatusIdentityProof('Proof was created succesfully.');
    // // // backend call verify proof
    // // // setStatusIdentityProof('Proof is being verified...');

    console.log('Call backend...');
    const res = await login(
      proofIdentity,
      publicSignalsIdentity,
      proofReputation,
      publicSignalsReputation
    );

    console.log(res);
    setLoginStatus(true);
  };

  if (loginStatus) {
    return (
      <div className='container flex p-4 mx-auto min-h-screen'>
        <main className='w-full'>
          <div className='text-center text-3xl font-mono'>
            You are logged in!
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className='container flex p-4 mx-auto min-h-screen'>
        <main className='w-full'>
          <div className='text-center text-3xl font-mono'>Login</div>
          <Alert
            alertType={alertType}
            alertText={alertText}
            alertHidden={alertHidden}
          />
          <div className='mx-auto text-center'>
            <div className='mt-4 flex flex-col w-1/6 mx-auto'>
              <div className='border-gray-700 text-gray-700  border-2 p-2 rounded-md'>
                <input
                  className='w-full'
                  type='text'
                  placeholder='public address'
                  onChange={(e) =>
                    setUserPubAddress(e.target.value.toLowerCase())
                  }
                />
              </div>
              <div className='border-gray-700 text-gray-700  border-2 p-2 rounded-md mt-4'>
                <input
                  className='w-full'
                  type='password'
                  placeholder='password'
                  onChange={(e) => setUserSecret(e.target.value)}
                />
              </div>
              <button
                className='bg-gray-700 text-white p-2 rounded-md mt-4'
                onClick={onLogin}
              >
                Login
              </button>

              <div className='border-gray-700 text-gray-700 pb-4  border-b-2 text-center text-3xl font-mono mt-8'>
                Proof Status
              </div>
              <div className='mt-4'>
                <div className='flex flex-col items-start'>
                  <div className='text-2xl'>Reputation Proof:</div>
                  <div>{statusReputationProof}</div>
                </div>
                <div className='flex flex-col items-start mt-4'>
                  <div className='text-2xl'>Identity Proof:</div>
                  <div>{statusIdentityProof}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
