let provider, program, wallet;
let referrer = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

(async function detectRef() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (ref) {
    localStorage.setItem("ref", ref);
  }
  referrer = localStorage.getItem("ref");
})();

async function getProgram() {
  const idl = await fetch("https://earndapp.netlify.app/idl.json").then(res => res.json());
  const programId = new solanaWeb3.PublicKey(idl.metadata.address);
  const anchorProvider = new anchor.AnchorProvider(connection, window.solana, {});
  return new anchor.Program(idl, programId, anchorProvider);
}

async function connectWallet() {
  provider = window.solana;
  if (!provider || !provider.isPhantom) {
    alert("Please install Phantom Wallet");
    return;
  }
  await provider.connect();
  wallet = provider.publicKey;
  document.getElementById("wallet-address").innerText = wallet.toString();
  program = await getProgram();
  fetchBalance();
}

async function claimZero() {
  if (!wallet) return alert("Connect wallet first");
  try {
    const tx = await program.methods.claimZero().accounts({
      user: wallet,
      systemProgram: solanaWeb3.SystemProgram.programId,
    }).rpc();
    alert("✅ Claimed successfully: " + tx);
    fetchBalance();
  } catch (e) {
    console.error(e);
    alert("❌ Already claimed or error");
  }
}

async function mintEarn() {
  if (!wallet) return alert("Connect wallet first");
  const input = document.getElementById("mint-amount").value;
  const amount = parseFloat(input);
  if (isNaN(amount) || amount < 0.1) return alert("Minimum 0.1 SOL");

  try {
    const tx = await program.methods
      .mintWithReferral(new anchor.BN(amount * 1e9), referrer ? new solanaWeb3.PublicKey(referrer) : null)
      .accounts({
        user: wallet,
        systemProgram: solanaWeb3.SystemProgram.programId,
      })
      .rpc();
    alert("✅ Minted: " + tx);
    fetchBalance();
  } catch (e) {
    console.error(e);
    alert("❌ Mint failed");
  }
}

async function fetchBalance() {
  try {
    const userToken = await program.account.userToken.fetch(wallet);
    document.getElementById("token-balance").innerText = userToken.amount.toString();
  } catch (e) {
    document.getElementById("token-balance").innerText = "0";
  }
}
