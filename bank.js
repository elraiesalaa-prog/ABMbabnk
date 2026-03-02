if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(
    "https://rahqhfowbphaipiadlkh.supabase.co",
    "sb_publishable_WAA4kMqzeM2_S6Mxi9t9kg_hbLIjbh9"
  );
}

const supabase = window.supabaseClient;
);
console.log("bank.js loaded");
async function register() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("محاولة تسجيل...");

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("تم التسجيل بنجاح ✅");
}


