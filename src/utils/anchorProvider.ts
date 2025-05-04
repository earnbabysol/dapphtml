import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import idl from '../../idl.json';

const programID = idl.metadata.address;
const network = 'https://api.mainnet-beta.solana.com';

export function getProvider() {
  const connection = new Connection(network, 'confirmed');
  const provider = new AnchorProvider(connection, window.solana, {
    preflightCommitment: 'processed',
  });
  return provider;
}

export async function getProgram(provider: any) {
  return new Program(idl as Idl, programID, provider);
}
