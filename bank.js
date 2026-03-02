const supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

let currentUser = null;

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) return alert(error.message);

  alert("تم إنشاء الحساب بنجاح");
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) return alert(error.message);

  currentUser = data.user;
  showDashboard();
}

async function showDashboard() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  await loadBalance();
  await loadTransactions();
}

async function loadBalance() {
  const { data } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", currentUser.id)
    .single();

  document.getElementById("balance").innerText = data?.balance || 0;
}

async function deposit() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount) return;

  await supabase.rpc("deposit_money", {
    user_id_input: currentUser.id,
    amount_input: amount
  });

  await loadBalance();
}

async function withdraw() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount) return;

  await supabase.rpc("withdraw_money", {
    user_id_input: currentUser.id,
    amount_input: amount
  });

  await loadBalance();
}

async function transfer() {
  const receiverEmail = document.getElementById("receiver").value;
  const amount = parseFloat(document.getElementById("transferAmount").value);

  const { data: receiver } = await supabase
    .from("users_view")
    .select("id")
    .eq("email", receiverEmail)
    .single();

  await supabase.rpc("transfer_money", {
    sender_id: currentUser.id,
    receiver_id: receiver.id,
    amount_input: amount
  });

  await loadBalance();
}

async function loadTransactions() {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("transactions");
  list.innerHTML = "";

  data?.forEach(t => {
    const li = document.createElement("li");
    li.innerText = `${t.type} - ${t.amount}`;
    list.appendChild(li);
  });
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}