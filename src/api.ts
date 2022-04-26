import axios from 'axios';

export async function getIdentityTreeData() {
  try {
    const reponse = await axios.get('http://localhost:4000/identitytree');
    console.log('response: ', reponse);

    const identityLeaves = JSON.parse(reponse.data.identityLeaves);
    const identityRoot = reponse.data.identityRoot;

    return {
      identityLeaves,
      identityRoot,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getReputationTreeData() {
  try {
    const reponse = await axios.get('http://localhost:4000/attestation_1');
    console.log('response: ', reponse);
    const attestation1Leaves = JSON.parse(reponse.data.attestation1Leaves);
    const attestation1Root = reponse.data['attestation_1_root'];

    return {
      attestation1Leaves,
      attestation1Root,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function login(
  identityProof: any,
  identityPublicSignals: any,
  reputationProof: any,
  reputationPublicSignals: any
) {
  console.log('in api submit');
  try {
    const reponse = await axios.post(
      'http://localhost:5000/login',
      {
        identityProof: identityProof,
        identityPublicSignals: identityPublicSignals,
        reputationProof: reputationProof,
        reputationPublicSignals: reputationPublicSignals,
      },
      {
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      }
    );
    console.log('response: ', reponse);
    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
