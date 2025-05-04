
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
  if (wallet && wallet.toString) {
    const link = window.location.origin + "?ref=" + wallet.toString();
    document.getElementById("invite-link").innerText = link;
    console.log("✅ Invite link updated:", link);
  } else {
    console.warn("⚠️ Wallet not ready for invite link.");
  }
}

function copyLink() {
  const text = document.getElementById("invite-link").innerText;
  if (!text || text === "-") return alert("Invite link not ready.");
  navigator.clipboard.writeText(text).then(() => {
    alert("Link copied!");
  });
}

async function getProgram() {
  const idl = await fetch("https://earndapp.netlify.app/idl.json").then(res => res.json());
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
  await provider.connect();
  await afterConnect();
}

async function connectOKX() {
  provider = window.okxwallet?.solana;
  if (!provider) {
    alert("Please install OKX Wallet");
    return;
  }
  await provider.connect();
  await afterConnect();
}

function disconnectWallet() {
  if (provider && provider.disconnect) provider.disconnect();
  wallet = null;
  document.getElementById("wallet-address").innerText = "Not connected";
  document.getElementById("invite-link").innerText = "-";
}

async function afterConnect() {
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!provider.publicKey) {
    console.error("❌ provider.publicKey missing");
    return alert("Wallet connection failed.");
  }

  wallet = new solanaWeb3.PublicKey(provider.publicKey.toString());
  document.getElementById("wallet-address").innerText = wallet.toString();

  program = await getProgram();
  updateInviteLink();
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
