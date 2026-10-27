const SUPABASE_URL = "https://bamdgnjaojwakrgjnrsj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sYvHA08Ml5QDSLXMFEn1Bw_FRjvdFIk";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.verificarSesion = async function () {
    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return null;
    }

    return data.session;
};

window.cerrarSesion = async function () {
    await window.supabaseClient.auth.signOut();
    window.location.replace("login.html");
};
