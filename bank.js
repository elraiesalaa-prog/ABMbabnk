var supabase = window.supabase.createClient(
"https://rahqhfowbphaipiadlkh.supabase.co",
"sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

// ================= أدوات =================

function makeEmail(username){
return username.toLowerCase().replace(/[^a-z0-9]/g,'') + "@bankapp.com";
}

function setLoading(state){
document.getElementById("authLoading").style.display = state ? "block":"none";
document.getElementById("registerBtn").disabled = state;
document.getElementById("loginBtn").disabled = state;
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
document.getElementById("loginView").style.display="none";
document.getElementById("registerView").style.display="block";
}

function showLogin(){
document.getElementById("registerView").style.display="none";
document.getElementById("loginView").style.display="block";
}

// ================= تسجيل =================

async function register(){

const username=document.getElementById("usernameReg").value.trim();
const password=document.getElementById("passwordReg").value.trim();

if(password.length<6){
alert("كلمة المرور 6 أحرف على الأقل");
return;
}

setLoading(true);

const {error:signUpError}=await supabase.auth.signUp({
email:makeEmail(username),
password:password
});

if(signUpError){
setLoading(false);
alert(signUpError.message);
return;
}

const {data:loginData,error:loginError}=await supabase.auth.signInWithPassword({
email:makeEmail(username),
password:password
});

if(loginError){
setLoading(false);
alert("تم إنشاء الحساب لكن فشل تسجيل الدخول");
return;
}

const user=loginData.user;

const {error:accError}=await supabase
.from("accounts")
.insert({
user_id:user.id,
balance:0,
full_name:document.getElementById("fullName").value,
account_name:document.getElementById("accountName").value
});

setLoading(false);

if(accError){
alert("خطأ إنشاء الحساب البنكي: "+accError.message);
return;
}

alert("تم إنشاء الحساب بنجاح");
}

// ================= دخول =================

async function login(){

const username=usernameInput();
const password=passwordInput();

setLoading(true);

const {error}=await supabase.auth.signInWithPassword({
email:makeEmail(username),
password:password
});

setLoading(false);

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

const {data:userData}=await supabase.auth.getUser();
const user=userData.user;

if(!user) return;

const {data}=await supabase
.from("accounts")
.select("*")
.eq("user_id",user.id)
.single();

if(!data) return;

document.getElementById("welcomeName").innerText="مرحباً "+(data.full_name||"");
document.getElementById("accountNameDisplay").innerText="الحساب: "+(data.account_name||"");
document.getElementById("balance").innerText=parseFloat(data.balance||0).toFixed(2)+" SDG";

loadTransactions();
}

// ================= إيداع =================

async function deposit(){

const amount=parseFloat(document.getElementById("amount").value);
const description=document.getElementById("description").value.trim();

if(isNaN(amount)||amount<=0){
alert("أدخل مبلغ صحيح");
return;
}

const user=(await supabase.auth.getUser()).data.user;

const {data:account}=await supabase
.from("accounts")
.select("*")
.eq("user_id",user.id)
.single();

const newBalance=parseFloat(account.balance)+amount;

await supabase
.from("accounts")
.update({balance:newBalance})
.eq("user_id",user.id);

await supabase
.from("transactions")
.insert({
user_id:user.id,
type:"deposit",
amount:amount,
description:description
});

document.getElementById("balance").innerText=newBalance.toFixed(2)+" SDG";

document.getElementById("amount").value="";
document.getElementById("description").value="";

loadTransactions();
}

// ================= سحب =================

async function withdraw(){

const amount=parseFloat(document.getElementById("amount").value);
const description=document.getElementById("description").value.trim();

if(isNaN(amount)||amount<=0){
alert("أدخل مبلغ صحيح");
return;
}

const user=(await supabase.auth.getUser()).data.user;

const {data:account}=await supabase
.from("accounts")
.select("*")
.eq("user_id",user.id)
.single();

if(account.balance<amount){
alert("الرصيد غير كافٍ");
return;
}

const newBalance=parseFloat(account.balance)-amount;

await supabase
.from("accounts")
.update({balance:newBalance})
.eq("user_id",user.id);

await supabase
.from("transactions")
.insert({
user_id:user.id,
type:"withdraw",
amount:amount,
description:description
});

document.getElementById("balance").innerText=newBalance.toFixed(2)+" SDG";

document.getElementById("amount").value="";
document.getElementById("description").value="";

loadTransactions();
}

// ================= كشف الحساب =================

async function loadTransactions(){

const {data:userData}=await supabase.auth.getUser();
const user=userData.user;

if(!user) return;

const {data}=await supabase
.from("transactions")
.select("*")
.eq("user_id",user.id)
.order("created_at",{ascending:false});

const tbody=document.getElementById("transactionsBody");
tbody.innerHTML="";

data.forEach(tx=>{

const row=document.createElement("tr");
const date=new Date(tx.created_at).toLocaleString("ar-EG");
const typeText=tx.type==="deposit"?"إيداع":"سحب";

row.innerHTML=`
<td>${date}</td>
<td>${typeText}</td>
<td>${tx.amount} SDG</td>
<td>${tx.description||""}</td>
`;

tbody.appendChild(row);

});
}

// ================= فلترة =================

async function filterTransactions(){

const from=document.getElementById("fromDate").value;
const to=document.getElementById("toDate").value;

const {data:userData}=await supabase.auth.getUser();
const user=userData.user;

let query=supabase
.from("transactions")
.select("*")
.eq("user_id",user.id)
.order("created_at",{ascending:false});

if(from) query=query.gte("created_at",from);
if(to) query=query.lte("created_at",to+"T23:59:59");

const {data}=await query;

const tbody=document.getElementById("transactionsBody");
tbody.innerHTML="";

data.forEach(tx=>{

const row=document.createElement("tr");
const date=new Date(tx.created_at).toLocaleString("ar-EG");
const typeText=tx.type==="deposit"?"إيداع":"سحب";

row.innerHTML=`
<td>${date}</td>
<td>${typeText}</td>
<td>${tx.amount}</td>
<td>${tx.description||""}</td>
`;

tbody.appendChild(row);

});
}

// ================= طباعة =================

async function downloadPDF(){

const printArea=document.getElementById("printArea");
const pdfBody=document.getElementById("pdfTransactionsBody");

document.getElementById("pdfFullName").innerText=document.getElementById("welcomeName").innerText;
document.getElementById("pdfAccountName").innerText=document.getElementById("accountNameDisplay").innerText;
document.getElementById("pdfBalance").innerText="الرصيد الحالي: "+document.getElementById("balance").innerText;

const rows=document.querySelectorAll("#transactionsBody tr");
pdfBody.innerHTML="";

rows.forEach(row=>{
pdfBody.appendChild(row.cloneNode(true));
});

printArea.style.display="block";

const opt={
margin:0,
filename:'كشف_حساب.pdf',
image:{type:'jpeg',quality:1},
html2canvas:{scale:4},
jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
};

await html2pdf().set(opt).from(printArea).save();

printArea.style.display="none";
}

// ================= الشاشات =================

function openStatement(){
document.getElementById("mainScreen").style.display="none";
document.getElementById("statementScreen").style.display="block";
}

function closeStatement(){
document.getElementById("statementScreen").style.display="none";
document.getElementById("mainScreen").style.display="block";
}

// ================= تأكيد العمليات =================

function confirmDeposit(){

const amount=document.getElementById("depositAmount").value;
const desc=document.getElementById("depositDesc").value;

document.getElementById("amount").value=amount;
document.getElementById("description").value=desc;

deposit();
closeDeposit();
}

function confirmWithdraw(){

const amount=document.getElementById("withdrawAmount").value;
const desc=document.getElementById("withdrawDesc").value;

document.getElementById("amount").value=amount;
document.getElementById("description").value=desc;

withdraw();
closeWithdraw();
}

// ================= خروج =================

async function logout(){
await supabase.auth.signOut();
location.reload();
}
