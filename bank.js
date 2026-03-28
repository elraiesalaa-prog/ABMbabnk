var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

let isProcessing = false; // 🔥 منع تكرار العمليات

function makeEmail(username){
  return username.toLowerCase().replace(/[^a-z0-9]/g,'') + "@bankapp.com";
}

function setLoading(state){
  document.getElementById("authLoading").style.display = state ? "block" : "none";
  document.getElementById("registerBtn").disabled = state;
  document.getElementById("loginBtn").disabled = state;
}

// ================= تحديث الرصيد الحقيقي =================
async function refreshBalance(){
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (data) {
    document.getElementById("balance").innerText =
      parseFloat(data.balance || 0).toFixed(2) + " SDG";
  }
}

// ================= تسجيل =================
async function register(){

 const username = document.getElementById("usernameReg").value.trim();
 const password = document.getElementById("passwordReg").value.trim();

  if(password.length < 6){
    alert("كلمة المرور 6 أحرف على الأقل");
    return;
  }

  setLoading(true);

  const { error: signUpError } = await supabase.auth.signUp({
    email: makeEmail(username),
    password: password
  });

  if(signUpError){
    setLoading(false);
    alert(signUpError.message);
    return;
  }

  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: makeEmail(username),
      password: password
    });

  if(loginError){
    setLoading(false);
    alert("تم إنشاء الحساب لكن فشل تسجيل الدخول");
    return;
  }

  const user = loginData.user;

  const { error: accError } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      balance: 0,
      full_name: document.getElementById("fullName").value,
      account_name: document.getElementById("accountName").value
    });

  setLoading(false);

  if(accError){
    alert("خطأ إنشاء الحساب البنكي: " + accError.message);
    return;
  }

  alert("تم إنشاء الحساب بنجاح ✅");
}

// ================= دخول =================
async function login(){

  const username = usernameInput();
  const password = passwordInput();

  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email: makeEmail(username),
    password: password
  });

  if(error){
    setLoading(false);
    alert("بيانات غير صحيحة");
    return;
  }

  setLoading(false);
  loadAccount();
}

// ================= تحميل الحساب =================
async function loadAccount(){

  document.getElementById("authCard").style.display = "none";
  document.getElementById("bankCard").style.display = "block";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if(!data) return;

  document.getElementById("welcomeName").innerText =
    "مرحباً " + (data.full_name || "");

  document.getElementById("accountNameDisplay").innerText =
    "الحساب: " + (data.account_name || "");

  await refreshBalance();
  await loadTransactions();
}

// ================= إيداع =================
async function deposit(){

  if (isProcessing) return;
  isProcessing = true;

  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if(isNaN(amount) || amount <= 0){
    alert("أدخل مبلغ صحيح");
    isProcessing = false;
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const newBalance = parseFloat(account.balance || 0) + amount;

  await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    amount: amount,
    description: description
  });

  await refreshBalance(); // 🔥 الحل الحقيقي
  await loadTransactions();

  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  isProcessing = false;
}

// ================= سحب =================
async function withdraw(){

  if (isProcessing) return;
  isProcessing = true;

  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if(isNaN(amount) || amount <= 0){
    alert("أدخل مبلغ صحيح");
    isProcessing = false;
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if(account.balance < amount){
    alert("الرصيد غير كافٍ");
    isProcessing = false;
    return;
  }

  const newBalance = parseFloat(account.balance) - amount;

  await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "withdraw",
    amount: amount,
    description: description
  });

  await refreshBalance();
  await loadTransactions();

  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  isProcessing = false;
}

// ================= كشف الحساب =================
async function loadTransactions() {

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tbody = document.getElementById("transactionsBody");
  tbody.innerHTML = "";

  data.forEach(tx => {

    const row = document.createElement("tr");
    const date = new Date(tx.created_at).toLocaleString("ar-EG");
    const typeText = tx.type === "deposit" ? "إيداع" : "سحب";

    row.innerHTML = `
      <td>${date}</td>
      <td>${typeText}</td>
      <td>${tx.amount} SDG</td>
      <td>${tx.description || ""}</td>
      <td><button class="editBtn">تعديل</button></td>
      <td><button class="deleteBtn">حذف</button></td>
    `;

    row.querySelector(".editBtn").onclick = () => {
      editTransaction(tx.id, tx.amount, tx.description || "");
    };

    row.querySelector(".deleteBtn").onclick = () => {
      deleteTransaction(tx.id);
    };

    tbody.appendChild(row);
  });
}

// ================= تعديل =================
async function editTransaction(id, amount, desc) {

  const newAmount = prompt("المبلغ الجديد", amount);
  if (newAmount === null) return;

  const newDesc = prompt("الوصف", desc);

  await supabase
    .from("transactions")
    .update({
      amount: Number(newAmount),
      description: newDesc
    })
    .eq("id", id);

  await loadTransactions();
  await refreshBalance();
}

// ================= حذف =================
async function deleteTransaction(id) {

  if (!confirm("هل تريد حذف العملية؟")) return;

  await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  await loadTransactions();
  await refreshBalance();
}

// ================= خروج =================
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}

// ================= أدوات =================
function usernameInput(){
  return (
    document.getElementById("username")?.value ||
    document.getElementById("usernameReg")?.value ||
    ""
  ).trim();
}

function passwordInput(){
  return (
    document.getElementById("password")?.value ||
    document.getElementById("passwordReg")?.value ||
    ""
  ).trim();
}

function showRegister(){
  document.getElementById("loginView").style.display = "none";
  document.getElementById("registerView").style.display = "block";
}

function showLogin(){
  document.getElementById("registerView").style.display = "none";
  document.getElementById("loginView").style.display = "block";
}
