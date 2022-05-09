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

export async function getReputationTreeData(id: number) {
  try {
    const reponse = await axios.get(`http://localhost:4000/attestation_${id}`);
    console.log('response: ', reponse);
    const attestationLeaves = JSON.parse(
      reponse.data[`attestation_${id}_leaves`]
    );
    const attestationRoot = reponse.data[`attestation_${id}_root`];

    return {
      attestationLeaves,
      attestationRoot,
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
  reputationPublicSignals: any,
  reputationId: number
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
        reputationId: reputationId,
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
