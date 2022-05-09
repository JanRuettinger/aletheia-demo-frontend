import { ethers } from 'ethers';
import React, { useState, Fragment } from 'react';
import { plonk } from 'snarkjs';
import { poseidon } from 'circomlibjs'; // v0.0.8
import { getIdentityTreeData, getReputationTreeData, login } from '../api';
import { buildMerkleTree } from '../utils';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';

export const useIsMounted = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
};

const reputationTypes = [
  { name: 'ZKU NFT owner', id: 1 },
  { name: 'Orca NFT owner', id: 2 },
];

export default function Home() {
  const [statusIdentityProof, setStatusIdentityProof] = useState('not started');
  const [statusReputationProof, setStatusReputationProof] =
    useState('not started');
  const [userSecret, setUserSecret] = useState('');
  const [userPubAddress, setUserPubAddress] = useState('');
  const [loginStatus, setLoginStatus] = useState(false);
  const [selected, setSelected] = useState(reputationTypes[0]);
  const [formError, setFormError] = useState('');
  const [formErrorHidden, setFormErrorHidden] = useState(true);

  const onLogin = async () => {
    const reputationTreeData = await getReputationTreeData(selected.id);
    const reputationTree = buildMerkleTree(
      reputationTreeData.attestationLeaves
    );

    const identityTreeData = await getIdentityTreeData();
    const identityTree = buildMerkleTree(identityTreeData.identityLeaves);

    console.log('identityTree: ', identityTree);
    console.log('reputationTree: ', reputationTree);

    // create identity
    const secret = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(userSecret));
    console.log('secret hexed: ', secret);
    const identityCommitment = poseidon([userPubAddress, secret]);

    // find index of leaves in both trees
    const indexReputationLeaf = reputationTree.indexOf(userPubAddress);
    const indexIdentityLeaf = identityTree.indexOf(
      identityCommitment.toString()
    );

    if (indexIdentityLeaf == -1 || indexReputationLeaf == -1) {
      setFormError('You are missing reputation or the password is wrong.');
      setFormErrorHidden(false);
      setTimeout(() => setFormErrorHidden(true), 2000);
      return;
    }

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
      password: secret,
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
      publicSignalsReputation,
      selected.id
    );

    console.log(res);
    setLoginStatus(true);
  };

  if (loginStatus) {
    return (
      <div className='container flex p-4 mx-auto min-h-screen'>
        <main className='w-full'>
          <div className='text-center text-3xl font-mono'>
            You are logged in as a {selected.name}!
          </div>
          <div>We (the website) don't have access to your wallet address.</div>
        </main>
      </div>
    );
  } else {
    return (
      <div className='container flex p-4 mx-auto min-h-screen'>
        <main className='w-full'>
          <div className='text-center text-3xl font-mono'>Login</div>
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

              <Listbox value={selected} onChange={setSelected}>
                <div className='relative mt-4 border-gray-700 border-2 rounded-md'>
                  <Listbox.Button className='relative w-full cursor-default rounded-lg bg-white p-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm'>
                    <span className='block truncate'>{selected.name}</span>
                    <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                      <SelectorIcon
                        className='h-5 w-5 text-gray-400'
                        aria-hidden='true'
                      />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave='transition ease-in duration-100'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                  >
                    <Listbox.Options className='absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
                      {reputationTypes.map((reputation, reputationIdx) => (
                        <Listbox.Option
                          key={reputationIdx}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active
                                ? 'bg-amber-100 text-amber-900'
                                : 'text-gray-900'
                            }`
                          }
                          value={reputation}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {reputation.name}
                              </span>
                              {selected ? (
                                <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600'>
                                  <CheckIcon
                                    className='h-5 w-5'
                                    aria-hidden='true'
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>

              <button
                className='bg-gray-700 text-white p-2 rounded-md mt-4'
                onClick={onLogin}
              >
                Login
              </button>
              {!formErrorHidden && (
                <div className='text-red-700'>{formError}</div>
              )}

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
