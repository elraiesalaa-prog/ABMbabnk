// اتصال Supabase
var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

// =========================
// تحويل اسم الحساب إلى بريد وهمي
// =========================
function makeFakeEmail(username) {
  return username.toLowerCase() + "@bank.local";
}

// =========================
// التسجيل
// =========================
async function register() {

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("أدخل اسم الحساب وكلمة المرور");
    return;
  }

  if (password.length < 6) {
    alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    return;
  }

  const fakeEmail = makeFakeEmail(username);

  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail,
    password: password
  });

  console.log("REGISTER:", data, error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("تم إنشاء الحساب بنجاح ✅");
}

// =========================
// تسجيل الدخول
// =========================
async function login() {

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const fakeEmail = makeFakeEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password: password
  });

  console.log("LOGIN:", data, error);

  if (error) {
    alert("بيانات الدخول غير صحيحة");
    return;
  }

  localStorage.setItem("uid", data.user.id);

  alert("تم تسجيل الدخول بنجاح ✅");
  location.reload();
}
