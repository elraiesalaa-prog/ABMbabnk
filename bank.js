var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

function makeEmail(username){
  return username.toLowerCase().replace(/[^a-z0-9]/g,'') + "@bankapp.com";
}

function setLoading(state){
  document.getElementById("authLoading").style.display = state ? "block" : "none";
  document.getElementById("registerBtn").disabled = state;
  document.getElementById("loginBtn").disabled = state;
}

// ================= تسجيل =================
async function register(){

  const username = usernameInput();
  const password = passwordInput();

  if(password.length < 6){
    alert("كلمة المرور 6 أحرف على الأقل");
    return;
  }

  setLoading(true);

  const { data, error } = await supabase.auth.signUp({
    email: makeEmail(username),
    password: password
  });

  if(error){
    setLoading(false);
    alert(error.message);
    return;
  }

  await supabase.from("accounts").insert({
    user_id: data.user.id,
    balance: 0
  });

  setLoading(false);
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

  document.getElementById("authCard").style.display="none";
  document.getElementById("bankCard").style.display="block";

  const user = (await supabase.auth.getUser()).data.user;

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  document.getElementById("balance").innerText =
    parseFloat(data.balance).toFixed(2) + " SDG";

  loadTransactions();
}
// ================= إيداع =================
async function deposit(){

  const amount = parseFloat(document.getElementById("amount").value);
  if(amount <= 0){
    alert("أدخل مبلغ صحيح");
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  // تسجيل العملية
  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    amount: amount
  });

  // تحديث الرصيد عبر rpc
  await supabase.rpc("increment_balance", {
    uid: user.id,
    amt: amount
  });

  loadAccount(); // تحديث كامل
}
// ================= سحب =================
async function withdraw(){

  const amount = parseFloat(document.getElementById("amount").value);
  if(amount <= 0) return;

  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "withdraw",
    amount: amount
  });

  await supabase.rpc("increment_balance", {
    uid: user.id,
    amt: -amount
  });

  loadAccount();
}

// ================= كشف الحساب =================
data.forEach(t=>{
  const color = t.type === "deposit" ? "green" : "red";
  html += `
    <div style="display:flex;justify-content:space-between;
                padding:8px;border-bottom:1px solid #eee;">
      <span style="color:${color}">${t.type}</span>
      <span>${t.amount}</span>
    </div>
  `;
});
// ================= خروج =================
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}

function usernameInput(){
  return document.getElementById("username").value.trim();
}

function passwordInput(){
  return document.getElementById("password").value.trim();
}


