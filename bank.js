// ===============================
// إنشاء اتصال Supabase
// ===============================
const supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

// ===============================
// عند تحميل الصفحة اربط الأزرار
// ===============================
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

// ===============================
// دالة التسجيل
// ===============================
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

// ===============================
// دالة تسجيل الدخول
// ===============================
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
