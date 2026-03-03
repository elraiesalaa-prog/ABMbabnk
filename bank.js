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

  alert("تم إنشاء الحساب بالكامل ✅");
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
  loadTransactions();
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
  loadTransactions();
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
    html += `
      <div class="transaction">
        <div>
          <strong>${t.type === "deposit" ? "إيداع" : "سحب"}</strong>
          <div style="font-size:12px;color:gray">
            ${t.description || ""}
          </div>
        </div>
        <span>${t.amount} SDG</span>
      </div>
    `;
  });

  document.getElementById("transactions").innerHTML = html;
}

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






