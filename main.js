
let provider, program, wallet;
let referrer = null;

const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

(async function detectRef() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (ref) localStorage.setItem("ref", ref);
  referrer = localStorage.getItem("ref");
})();

function updateInviteLink() {
  const fullText = document.getElementById("wallet-address").innerText;
  const parts = fullText.split("Wallet: ");
  if (parts.length === 2) {
    const addr = parts[1].trim();
    const link = window.location.origin + "?ref=" + addr;
    document.getElementById("invite-link").innerText = link;
  } else {
    document.getElementById("invite-link").innerText = "Invite link not ready.";
  }
}

function copyLink() {
  const text = document.getElementById("invite-link").innerText;
  if (!text || text === "-" || text.includes("not ready")) return alert("Invite link not ready.");
  navigator.clipboard.writeText(text).then(() => {
    alert("Link copied!");
  });
}

async function getProgram() {
  const idl = await fetch("idl.json").then(res => res.json());
  const programId = new solanaWeb3.PublicKey(idl.metadata.address);
  const anchorProvider = new anchor.AnchorProvider(connection, provider, {});
  return new anchor.Program(idl, programId, anchorProvider);
}

async function connectPhantom() {
  provider = window.solana;
  if (!provider || !provider.isPhantom) {
    alert("Please install Phantom");
    return;
  }
  const resp = await provider.connect();
  wallet = new solanaWeb3.PublicKey(resp.publicKey.toString());
  await afterConnect();
}

async function connectOKX() {
  provider = window.okxwallet?.solana;
  if (!provider) {
    alert("Please install OKX Wallet");
    return;
  }
  const resp = await provider.connect();
  wallet = new solanaWeb3.PublicKey(resp.publicKey.toString());
  await afterConnect();
}

function disconnectWallet() {
  if (provider && provider.disconnect) provider.disconnect();
  wallet = null;
  document.getElementById("wallet-address").innerText = "Wallet: -";
  document.getElementById("invite-link").innerText = "-";
}

async function afterConnect() {
  if (!wallet) return alert("Wallet connection failed.");
  document.getElementById("wallet-address").innerText = "Wallet: " + wallet.toString();
  program = await getProgram();
  fetchBalance();
  updateInviteLink();
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
