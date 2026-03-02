const supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

let currentUser = null;
let currentAccountId = null;

// ============================
// عند تحميل الصفحة
// ============================
document.addEventListener("DOMContentLoaded", () => {

  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (registerBtn) {
    registerBtn.addEventListener("click", register);
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

});
  }
});

// ============================
// تسجيل حساب
// ============================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("تم إنشاء الحساب بنجاح ✅");
}

// ============================
// تسجيل دخول
// ============================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;

  alert("تم تسجيل الدخول بنجاح ✅");

  await loadAccount();
  showDashboard();
}

// ============================
// إنشاء حساب بنكي إذا لم يوجد
// ============================
async function loadAccount() {
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  if (!account) {
    const accountNumber = "AC" + Math.floor(Math.random() * 100000000);

    const { data: newAccount } = await supabase
      .from("accounts")
      .insert([{
        user_id: currentUser.id,
        account_number: accountNumber
      }])
      .select()
      .single();

    currentAccountId = newAccount.id;
    document.getElementById("accountNumber").innerText = accountNumber;
    document.getElementById("balance").innerText = 0;
  } else {
    currentAccountId = account.id;
    document.getElementById("accountNumber").innerText = account.account_number;
    document.getElementById("balance").innerText = account.balance;
  }
}

// ============================
// عرض لوحة التحكم
// ============================
function showDashboard() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadTransactions();
}

// ============================
// تحديث الرصيد
// ============================
async function refreshBalance() {
  const { data } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", currentAccountId)
    .single();

  document.getElementById("balance").innerText = data.balance;
}

// ============================
// إيداع
// ============================
async function deposit() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount || amount <= 0) return alert("أدخل مبلغ صحيح");

  const { error } = await supabase.rpc("deposit_money", {
    amount_input: amount
  });

  if (error) return alert(error.message);

  await refreshBalance();
  loadTransactions();
}

// ============================
// سحب
// ============================
async function withdraw() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount || amount <= 0) return alert("أدخل مبلغ صحيح");

  const { error } = await supabase.rpc("withdraw_money", {
    amount_input: amount
  });

  if (error) return alert(error.message);

  await refreshBalance();
  loadTransactions();
}

// ============================
// تحويل
// ============================
async function transfer() {
  const receiverAccount = document.getElementById("receiverAccount").value;
  const amount = parseFloat(document.getElementById("transferAmount").value);

  if (!receiverAccount || !amount) return alert("أدخل البيانات كاملة");

  const { error } = await supabase.rpc("transfer_money", {
    receiver_account: receiverAccount,
    amount_input: amount
  });

  if (error) return alert(error.message);

  alert("تم التحويل بنجاح ✅");
  await refreshBalance();
  loadTransactions();
}

// ============================
// عرض العمليات
// ============================
async function loadTransactions() {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", currentAccountId)
    .order("created_at", { ascending: false });

  const list = document.getElementById("transactions");
  list.innerHTML = "";

  data?.forEach(tx => {
    const li = document.createElement("li");

    li.innerText =
      tx.type + " | " +
      tx.amount + " جنيه | " +
      new Date(tx.created_at).toLocaleString();

    list.appendChild(li);
  });
}

// ============================
// كشف الحساب بالفترة
// ============================
async function loadStatement() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  if (!fromDate || !toDate) return alert("حدد الفترة");

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", currentAccountId)
    .gte("created_at", fromDate)
    .lte("created_at", toDate)
    .order("created_at", { ascending: false });

  const list = document.getElementById("transactions");
  list.innerHTML = "";

  data?.forEach(tx => {
    const li = document.createElement("li");

    li.innerText =
      tx.type + " | " +
      tx.amount + " جنيه | " +
      new Date(tx.created_at).toLocaleString();

    list.appendChild(li);
  });
}

// ============================
// تسجيل خروج
// ============================
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

