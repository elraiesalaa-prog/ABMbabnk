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

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("أدخل البريد وكلمة المرور");
    return;
  }

  if (password.length < 6) {
    alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    return;
  }

  const response = await supabase.auth.signUp({
    email: email,
    password: password
  });

  console.log("REGISTER RESPONSE:", response);

  if (response.error) {
    alert("خطأ: " + response.error.message);
    return;
  }

  if (!response.data.user) {
    alert("لم يتم إنشاء الحساب");
    return;
  }

  alert("تم إنشاء الحساب بنجاح ✅");
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

