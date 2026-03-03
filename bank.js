// الاتصال بـ Supabase
var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

// تحويل اسم الحساب إلى بريد وهمي صالح
function makeEmail(username){
  username = username.toLowerCase().replace(/[^a-z0-9]/g,'');
  return username + "@bankapp.com";
}

// ================= تسجيل =================
async function register(){

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if(password.length < 6){
    alert("كلمة المرور 6 أحرف على الأقل");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: makeEmail(username),
    password: password
  });

  if(error){ alert(error.message); return; }

  // إنشاء حساب بنكي تلقائي
  await supabase.from("accounts").insert({
    user_id: data.user.id,
    balance: 0
  });

  alert("تم إنشاء الحساب ✅");
}

// ================= دخول =================
async function login(){

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: makeEmail(username),
    password: password
  });

  if(error){ alert("بيانات غير صحيحة"); return; }

  initBank();
}

// ================= تحميل بيانات الحساب =================
async function initBank(){

  document.getElementById("authBox").style.display="none";
  document.getElementById("bankBox").style.display="block";

  const user = (await supabase.auth.getUser()).data.user;

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  document.getElementById("balance").innerText = data.balance;

  loadTransactions();
}

// ================= إيداع =================
async function deposit(){

  const amount = parseFloat(document.getElementById("amount").value);
  if(amount<=0) return;

  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    amount: amount
  });

  await supabase.rpc('increment_balance', {
    uid: user.id,
    amt: amount
  });

  initBank();
}

// ================= سحب =================
async function withdraw(){

  const amount = parseFloat(document.getElementById("amount").value);
  if(amount<=0) return;

  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "withdraw",
    amount: amount
  });

  await supabase.rpc('increment_balance', {
    uid: user.id,
    amt: -amount
  });

  initBank();
}

// ================= كشف الحساب =================
async function loadTransactions(){

  const user = (await supabase.auth.getUser()).data.user;

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at",{ascending:false});

  let html="";
  data.forEach(t=>{
    html += `<p>${t.type} - ${t.amount}</p>`;
  });

  document.getElementById("transactions").innerHTML = html;
}

// ================= خروج =================
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}
