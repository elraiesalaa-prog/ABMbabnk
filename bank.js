var supabase = window.supabase.createClient(
  "https://rahqhfowbphaipiadlkh.supabase.co",
  "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
);

function makeEmail(username){
  username = username.toLowerCase().replace(/[^a-z0-9]/g,'');
  return username + "@bankapp.com";
}

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

  if(error){
    alert(error.message);
    return;
  }

  await supabase.from("accounts").insert({
    user_id: data.user.id,
    balance: 0
  });

  alert("تم إنشاء الحساب بنجاح");
}

async function login(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const { error } = await supabase.auth.signInWithPassword({
    email: makeEmail(username),
    password: password
  });

  if(error){
    alert("بيانات غير صحيحة");
    return;
  }

  alert("تم تسجيل الدخول");
}
