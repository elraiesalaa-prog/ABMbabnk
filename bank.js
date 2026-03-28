var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

let isProcessing = false;

// ================= أدوات =================
function makeEmail(username){
  return username.toLowerCase().replace(/[^a-z0-9]/g,'') + "@bankapp.com";
}

// ================= الرصيد من القيود =================
async function refreshBalance(){

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from("journal_entries")
    .select("type, amount")
    .eq("user_id", user.id);

  let balance = 0;

  data.forEach(entry => {
    if(entry.type === "deposit") balance += Number(entry.amount);
    if(entry.type === "withdraw") balance -= Number(entry.amount);
  });

  document.getElementById("balance").innerText =
    balance.toFixed(2) + " SDG";
}

// ================= تسجيل =================
async function register(){

  const username = document.getElementById("usernameReg").value.trim();
  const password = document.getElementById("passwordReg").value.trim();

  if(password.length < 6){
    alert("كلمة المرور 6 أحرف على الأقل");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: makeEmail(username),
    password: password
  });

  if(error){
    alert(error.message);
    return;
  }

  alert("تم إنشاء الحساب");
}

// ================= دخول =================
async function login(){

  const { error } = await supabase.auth.signInWithPassword({
    email: makeEmail(usernameInput()),
    password: passwordInput()
  });

  if(error){
    alert("بيانات غير صحيحة");
    return;
  }

  loadAccount();
}

// ================= تحميل =================
async function loadAccount(){

  document.getElementById("authCard").style.display="none";
  document.getElementById("bankCard").style.display="block";

  await refreshBalance();
  await loadTransactions();

  startRealtime();
}

// ================= إيداع =================
async function deposit(){

  if(isProcessing) return;
  isProcessing = true;

  const amount = Number(document.getElementById("amount").value);
  const description = document.getElementById("description").value;

  if(amount <= 0){
    alert("مبلغ غير صحيح");
    isProcessing = false;
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("journal_entries").insert({
    user_id: user.id,
    type: "deposit",
    amount: amount,
    description: description
  });

  await refreshBalance();
  await loadTransactions();

  isProcessing = false;
}

// ================= سحب =================
async function withdraw(){

  if(isProcessing) return;
  isProcessing = true;

  const amount = Number(document.getElementById("amount").value);
  const description = document.getElementById("description").value;

  const currentBalance = parseFloat(
    document.getElementById("balance").innerText
  );

  if(amount > currentBalance){
    alert("الرصيد غير كاف");
    isProcessing = false;
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("journal_entries").insert({
    user_id: user.id,
    type: "withdraw",
    amount: amount,
    description: description
  });

  await refreshBalance();
  await loadTransactions();

  isProcessing = false;
}

// ================= كشف الحساب =================
async function loadTransactions(){

  const user = (await supabase.auth.getUser()).data.user;

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {ascending:false});

  const tbody = document.getElementById("transactionsBody");
  tbody.innerHTML="";

  data.forEach(tx => {

    const row=document.createElement("tr");

    const date=new Date(tx.created_at).toLocaleString("ar-EG");
    const typeText = tx.type === "deposit" ? "إيداع" : "سحب";

    row.innerHTML=`
      <td>${date}</td>
      <td>${typeText}</td>
      <td>${tx.amount}</td>
      <td>${tx.description || ""}</td>
      <td><button onclick="editTransaction('${tx.id}')">تعديل</button></td>
      <td><button onclick="deleteTransaction('${tx.id}')">حذف</button></td>
    `;

    tbody.appendChild(row);
  });
}

// ================= تعديل =================
async function editTransaction(id){

  const newAmount = prompt("المبلغ الجديد");
  if(!newAmount) return;

  await supabase
    .from("journal_entries")
    .update({ amount: Number(newAmount) })
    .eq("id", id);

  await refreshBalance();
  await loadTransactions();
}

// ================= حذف =================
async function deleteTransaction(id){

  if(!confirm("حذف؟")) return;

  await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id);

  await refreshBalance();
  await loadTransactions();
}

// ================= realtime =================
function startRealtime(){

  supabase
    .channel('journal-live')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'journal_entries' },
      async () => {
        await refreshBalance();
        await loadTransactions();
      }
    )
    .subscribe();
}

// ================= أدوات =================
function usernameInput(){
  return document.getElementById("username").value.trim();
}

function passwordInput(){
  return document.getElementById("password").value.trim();
}

function logout(){
  supabase.auth.signOut();
  location.reload();
}
