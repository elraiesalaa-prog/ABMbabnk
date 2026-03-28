var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

let isProcessing = false;

// ================= أدوات =================
function makeEmail(username){
  return username.toLowerCase().replace(/[^a-z0-9]/g,'') + "@bankapp.com";
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

  if(data){
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

// ================= تحميل الحساب =================
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

  await refreshBalance();
  await loadTransactions();

  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  isProcessing = false;
}

// ================= سحب =================
async function withdraw(){

  if(isProcessing) return;
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
async function loadTransactions(){

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
      <td><button onclick="editTransaction('${tx.id}')">تعديل</button></td>
      <td><button onclick="deleteTransaction('${tx.id}')">حذف</button></td>
    `;

    tbody.appendChild(row);
  });
}
// ================= طباعة الكشف =================
async function downloadPDF() {

  const printArea = document.getElementById("printArea");
  const pdfBody = document.getElementById("pdfTransactionsBody");

  // تعبئة بيانات العنوان
  document.getElementById("pdfFullName").innerText =
    document.getElementById("welcomeName").innerText;

  document.getElementById("pdfAccountName").innerText =
    document.getElementById("accountNameDisplay").innerText;

  document.getElementById("pdfBalance").innerText =
    "الرصيد الحالي: " + document.getElementById("balance").innerText;

  // نسخ العمليات
  const rows = document.querySelectorAll("#transactionsBody tr");
  pdfBody.innerHTML = "";

  rows.forEach(row => {
    pdfBody.appendChild(row.cloneNode(true));
  });

  // إظهار منطقة الطباعة مؤقتاً
  printArea.style.display = "block";

  const opt = {
    margin: 0,
    filename: 'كشف_حساب.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { 
      scale: 4,
      useCORS: true
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  await html2pdf().set(opt).from(printArea).save();

  // إخفاؤها مرة أخرى
  printArea.style.display = "none";
}
// ================= فلترة =================

async function filterTransactions(){

  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {ascending:false});

  if(from){
    query = query.gte("created_at", from);
  }

  if(to){
    query = query.lte("created_at", to + "T23:59:59");
  }

  const { data, error } = await query;

  if(error){
    console.log(error);
    return;
  }

  const tbody = document.getElementById("transactionsBody");
  tbody.innerHTML="";

  data.forEach(tx=>{

    const row=document.createElement("tr");

    const date=new Date(tx.created_at).toLocaleString("ar-EG");

    let typeText="";

    if(tx.type==="deposit") typeText="إيداع";
    else if(tx.type==="withdraw") typeText="سحب";
    else if(tx.type==="transfer") typeText="تحويل";

    row.innerHTML=`
      <td>${date}</td>
      <td>${typeText}</td>
      <td>${tx.amount || ""}</td>
      <td>${tx.description || ""}</td>
    `;

    tbody.appendChild(row);

  });

}
// ================= تعديل =================
async function editTransaction(id){

  const newAmount = prompt("المبلغ الجديد");
  if(!newAmount) return;

  await supabase
    .from("transactions")
    .update({ amount: Number(newAmount) })
    .eq("id", id);

  await loadTransactions();
  await refreshBalance();
}

// ================= حذف =================
async function deleteTransaction(id){

  if(!confirm("هل تريد حذف العملية؟")) return;

  await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  await loadTransactions();
  await refreshBalance();
}

// ================= realtime =================
function startRealtime(){

  supabase
    .channel('bank-live')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      async () => {
        await loadTransactions();
        await refreshBalance();
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'accounts' },
      async () => {
        await refreshBalance();
      }
    )
    .subscribe();
}

// ================= خروج =================
function logout(){
  supabase.auth.signOut();
  location.reload();
}

// ================= أدوات =================
function usernameInput(){
  return document.getElementById("username").value.trim();
}

function passwordInput(){
  return document.getElementById("password").value.trim();
  
}
// ================= إصلاح الدوال المفقودة =================

// تسجيل
function showRegister(){
  document.getElementById("loginView").style.display = "none";
  document.getElementById("registerView").style.display = "block";
}

function showLogin(){
  document.getElementById("registerView").style.display = "none";
  document.getElementById("loginView").style.display = "block";
}

// شاشة العمليات
function openDeposit(){
  document.getElementById("mainScreen").style.display = "none";
  document.getElementById("depositScreen").style.display = "block";
}

function closeDeposit(){
  document.getElementById("depositScreen").style.display = "none";
  document.getElementById("mainScreen").style.display = "block";
}

// كشف الحساب
function showStatement(){
  document.getElementById("mainScreen").style.display = "none";
  document.getElementById("statementScreen").style.display = "block";
  loadTransactions(); // تحميل البيانات
}

function closeStatement(){
  document.getElementById("statementScreen").style.display = "none";
  document.getElementById("mainScreen").style.display = "block";
}
