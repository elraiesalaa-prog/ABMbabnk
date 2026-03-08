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

 const username = document.getElementById("usernameReg").value.trim();
const password = document.getElementById("passwordReg").value.trim();

  if(password.length < 6){
    alert("كلمة المرور 6 أحرف على الأقل");
    return;
  }

  setLoading(true);

  // 1️⃣ إنشاء المستخدم
  const { error: signUpError } = await supabase.auth.signUp({
    email: makeEmail(username),
    password: password
  });

  if(signUpError){
    setLoading(false);
    alert(signUpError.message);
    return;
  }

  // 2️⃣ تسجيل الدخول مباشرة
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

  // 3️⃣ إنشاء الحساب البنكي
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

  const authCard = document.getElementById("authCard");
  const bankCard = document.getElementById("bankCard");

  if(authCard) authCard.style.display = "none";
  if(bankCard) bankCard.style.display = "block";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if(!data) return;

  const welcomeName = document.getElementById("welcomeName");
  const accountNameDisplay = document.getElementById("accountNameDisplay");
  const balanceEl = document.getElementById("balance");

  if(welcomeName)
    welcomeName.innerText = "مرحباً " + (data.full_name || "");

  if(accountNameDisplay)
    accountNameDisplay.innerText = "الحساب: " + (data.account_name || "");

  if(balanceEl)
    balanceEl.innerText =
      parseFloat(data.balance || 0).toFixed(2) + " SDG";

  loadTransactions();
}
// ================= إيداع =================
async function deposit(){

  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if(isNaN(amount) || amount <= 0){
    alert("أدخل مبلغ صحيح");
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  // جلب الحساب
  const { data: account, error: accFetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if(accFetchError){
    alert("خطأ جلب الحساب");
    return;
  }

  const newBalance = parseFloat(account.balance) + amount;

  // تحديث الرصيد
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("user_id", user.id);

  if(updateError){
    alert("خطأ تحديث الرصيد: " + updateError.message);
    return;
  }

  // تسجيل العملية
  const { error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "deposit",
      amount: amount,
      description: description
    });

  if(insertError){
    alert("خطأ تسجيل العملية: " + insertError.message);
    return;
  }

  // تحديث الرصيد فوراً في الواجهة
  document.getElementById("balance").innerText =
    newBalance.toFixed(2) + " SDG";

  // تنظيف الحقول
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  // تحديث كشف الحساب
 
  await loadTransactions();
}
// ================= سحب =================

async function withdraw(){

  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if(isNaN(amount) || amount <= 0){
    alert("أدخل مبلغ صحيح");
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  // جلب الحساب
  const { data: account, error: accFetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if(accFetchError){
    alert("خطأ جلب الحساب");
    return;
  }

  if(account.balance < amount){
    alert("الرصيد غير كافٍ");
    return;
  }

  const newBalance = parseFloat(account.balance) - amount;

  // تحديث الرصيد
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("user_id", user.id);

  if(updateError){
    alert("خطأ تحديث الرصيد: " + updateError.message);
    return;
  }

  // تسجيل العملية
  const { error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "withdraw",
      amount: amount,
      description: description
    });

  if(insertError){
    alert("خطأ تسجيل العملية: " + insertError.message);
    return;
  }

  // تحديث الرصيد فوراً
  document.getElementById("balance").innerText =
    newBalance.toFixed(2) + " SDG";

  // تنظيف الحقول
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  // تحديث العمليات
 
  await loadTransactions();
}

// ================= كشف الحساب =================
async function loadTransactions() {

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

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
// ================= طباعة =================
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
// ================= شاشات العمليات =================
function openDeposit(){
document.getElementById("depositScreen").style.display="block";
}

function closeDeposit(){
document.getElementById("depositScreen").style.display="none";
}

function openWithdraw(){
document.getElementById("withdrawScreen").style.display="block";
}

function closeWithdraw(){
document.getElementById("withdrawScreen").style.display="none";
}

function showStatement(){
document.getElementById("statementScreen").style.display="block";
loadStatement();
}

function closeStatement(){
document.getElementById("statementScreen").style.display="none";
}
// ================= تعديل =================
async function editTransaction(id, amount, desc) {

  const newAmount = prompt("المبلغ الجديد", amount);
  if (newAmount === null) return;

  const newDesc = prompt("الوصف", desc);

  const { error } = await supabase
    .from("transactions")
    .update({
      amount: Number(newAmount),
      description: newDesc
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("فشل تعديل العملية");
    return;
  }

  await loadTransactions();
  await updateBalance();
}
// ================= حذف =================
async function deleteTransaction(id) {

  if (!confirm("هل تريد حذف العملية؟")) return;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("فشل حذف العملية");
    return;
  }

  await loadTransactions();
  await updateBalance();
}
// ================= خروج =================
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}

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







