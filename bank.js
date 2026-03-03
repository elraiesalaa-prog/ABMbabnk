// منع تكرار التعريف نهائياً
var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

// ربط الأزرار بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("registerBtn")
    .addEventListener("click", register);

  document.getElementById("loginBtn")
    .addEventListener("click", login);

});

// =======================
// دالة التسجيل
// =======================
async function register() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("أدخل البريد وكلمة المرور");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  console.log("REGISTER:", data, error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("تم إنشاء الحساب بنجاح ✅");
}

// =======================
// دالة تسجيل الدخول
// =======================
async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  console.log("LOGIN:", data, error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("تم تسجيل الدخول بنجاح ✅");
}
