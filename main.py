import streamlit as st
from supabase import create_client
import uuid
from datetime import datetime
import pandas as pd
import io
import re
import plotly.express as px  

# --- BAĞLANTI AYARLARI (SECRETS KULLANIMI) ---
URL = st.secrets["SUPABASE_URL"]
KEY = st.secrets["SUPABASE_KEY"]
supabase = create_client(URL, KEY)

# --- SAYFA AYARLARI VE CSS ---
st.set_page_config(page_title="Lisans Takip Sistemi", layout="wide")

st.markdown("""
    <style>
    .viewerBadge_container__1QS1n {display: none;}
    a.header-anchor {display: none;}
    .stMarkdown svg {display: none;}
    div[data-testid="metric-container"] {
        background-color: #1e1e2f;
        border: 1px solid #333;
        padding: 15px;
        border-radius: 10px;
    }
    </style>
""", unsafe_allow_html=True)

# --- 🔐 GİRİŞ SİSTEMİ ---
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.user_role = None

if not st.session_state.logged_in:
    st.title("🔐 Lisans Yönetim Paneli", anchor=False)
    with st.form("login_form"):
        k_adi = st.text_input("Kullanıcı Adı")
        sifre = st.text_input("Şifre", type="password")
        if st.form_submit_button("Sisteme Giriş Yap", use_container_width=True):
            user_check = supabase.table("users").select("*").eq("users", k_adi).eq("password", sifre).execute()
            if user_check.data:
                st.session_state.logged_in = True
                st.session_state.current_user = user_check.data[0]['users']
                st.session_state.user_role = user_check.data[0]['role']
                st.rerun()
            else:
                st.error("❌ Hatalı Kullanıcı Adı veya Şifre!")
    st.stop()

# --- 🛠️ STATE INITIALIZE ---
if "editing_id" not in st.session_state: st.session_state.editing_id = None
if "new_sw_count" not in st.session_state: st.session_state.new_sw_count = 1
if "new_sc_count" not in st.session_state: st.session_state.new_sc_count = 1
if "new_sct_count" not in st.session_state: st.session_state.new_sct_count = 1 
if "form_reset_key" not in st.session_state: st.session_state.form_reset_key = 0

# --- YARDIMCI FONKSİYONLAR ---
def kalan_gun_bul(tarih_str):
    if not tarih_str: return None
    try:
        hedef = datetime.strptime(tarih_str, "%Y-%m-%d").date()
        bugun = datetime.now().date()
        return (hedef - bugun).days
    except: return None

def str_to_date(date_str):
    if date_str and isinstance(date_str, str):
        try: return datetime.strptime(date_str, "%Y-%m-%d").date()
        except: return None
    return None

def durum_yazdir(baslik, tarih):
    kalan = kalan_gun_bul(tarih)
    if kalan is None: return
    if kalan < 0: st.error(f"❌ **{baslik} SÜRESİ DOLDU!** ({abs(kalan)} gün geçmiş) - Bitiş: {tarih}")
    elif kalan <= 30: st.error(f"🚨 **{baslik} KRİTİK:** Son **{kalan} gün** kaldı! - Bitiş: {tarih}")
    elif kalan <= 60: st.warning(f"⚠️ **{baslik} Yaklaşıyor:** {kalan} gün var. - Bitiş: {tarih}")
    else: st.success(f"✅ **{baslik} Aktif:** {kalan} gün var. - Bitiş: {tarih}")

def dosya_adi_temizle(isim):
    isim = isim.replace('ı', 'i').replace('İ', 'I').replace('ğ', 'g').replace('Ğ', 'G') \
               .replace('ü', 'u').replace('Ü', 'U').replace('ş', 's').replace('Ş', 'S') \
               .replace('ö', 'o').replace('Ö', 'O').replace('ç', 'c').replace('Ç', 'C')
    return re.sub(r'[^A-Za-z0-9\.\-\_]', '_', isim)

def cleanup_edit_state(c_id):
    for k in list(st.session_state.keys()):
        if str(c_id) in k and "edit_" in k:
            del st.session_state[k]

sc_module_options = [
    "2.5D Frezeleme", "3D HSS (Yüzey İşleme)", "3D HSM/HSR", 
    "iMachining 2D", "iMachining 3D", "Simültane 4/5 Eksen", 
    "Tornalama", "Gelişmiş Mill-Turn", "Kayar Otomat (Swiss-Type)", "Solid Probe"
]

# --- 🚀 VERİ ÖNBELLEKLEME ---
@st.cache_data(show_spinner=False, ttl=600)
def verileri_cek_ve_birlestir():
    comps = supabase.table("companies").select("*").order("name").execute().data
    cons = supabase.table("contacts").select("*").execute().data
    notes = supabase.table("company_notes").select("*").execute().data
    lics = supabase.table("licenses").select("*").execute().data
    files = supabase.table("company_files").select("*").execute().data
    all_lics_joined = supabase.table("licenses").select("*, companies(name)").execute().data
    users_list = supabase.table("users").select("*").execute().data

    for c in comps:
        c['contacts'] = [x for x in cons if x['company_id'] == c['id']]
        c['company_notes'] = [x for x in notes if x['company_id'] == c['id']]
        c['licenses'] = [x for x in lics if x['company_id'] == c['id']]
        c['company_files'] = [x for x in files if x['company_id'] == c['id']]

    return comps, all_lics_joined, users_list

tum_firmalar_data, tum_lisanslar_data, tum_kullanicilar = verileri_cek_ve_birlestir()


# --- ORTAK GÖRÜNTÜLEME VE DÜZENLEME FONKSİYONU ---
def firma_detay_goster(company, suffix, varsayilan_acik=False):
    c_id = company['id']
    
    # ================= 1. DÜZENLEME MODU =================
    if st.session_state.editing_id == c_id:
        with st.expander(f"📝 {company['name'].upper()} Güncelleniyor", expanded=True):
            curr_con = company.get('contacts', [])
            curr_note = company.get('company_notes', [])
            curr_lics = company.get('licenses', [])
            
            col_e1, col_e2 = st.columns(2)
            with col_e1:
                e_name = st.text_input("Firma Adı", value=company['name'], key=f"edit_name_{c_id}")
                e_addr = st.text_area("Adres", value=company.get('address', ''), key=f"edit_addr_{c_id}")
                e_c_name = st.text_input("Yetkili Adı", value=curr_con[0]['full_name'] if curr_con else "", key=f"edit_cname_{c_id}")
                e_c_phone = st.text_input("Telefon", value=curr_con[0]['phone'] if curr_con else "", key=f"edit_cphone_{c_id}")
                e_note = st.text_area("Firma Notu", value=curr_note[0]['note'] if curr_note else "", key=f"edit_note_{c_id}")
            with col_e2:
                e_file = st.file_uploader("📁 Yeni Dosya Ekle", key=f"edit_file_{c_id}")
                
                # YENİ: Sadece Adminlerin Görebileceği Dosya Silme Alanı
                if st.session_state.user_role == "admin" and company.get('company_files'):
                    st.markdown("---")
                    st.write("🗑️ **Mevcut Dosyaları Sil**")
                    for f in company.get('company_files', []):
                        c_f1, c_f2 = st.columns([4, 1])
                        c_f1.caption(f"📄 {f['file_name']}")
                        if c_f2.button("Sil", key=f"del_file_edit_{f['id']}"):
                            try:
                                file_path = f['file_url'].split("firma%20postlari/")[-1]
                                supabase.storage.from_("firma postlari").remove([file_path])
                            except: pass
                            supabase.table("company_files").delete().eq("id", f['id']).execute()
                            st.cache_data.clear()
                            st.rerun()

            st.markdown("---")
            st.write("🛠️ **SolidWorks Lisansları**")
            sw_list = [l for l in curr_lics if l['software_type'].startswith('solidworks')]
            if f"edit_sw_count_{c_id}" not in st.session_state:
                st.session_state[f"edit_sw_count_{c_id}"] = max(1, len(sw_list))
                
            sw_edit_inputs = []
            for i in range(st.session_state[f"edit_sw_count_{c_id}"]):
                existing_l = sw_list[i] if i < len(sw_list) else None
                def_type, def_s, def_d = "Standard", "", None
                if existing_l:
                    parts = existing_l['software_type'].split(":")
                    def_type = parts[1].strip() if len(parts) > 1 else "Standard"
                    def_s = existing_l['serial_number']
                    def_d = str_to_date(existing_l.get('sub_date'))
                    
                c1, c2, c3 = st.columns(3)
                sw_t = c1.selectbox(f"{i+1}. Lisans Tipi", ["Standard", "Professional", "Premium"], index=["Standard", "Professional", "Premium"].index(def_type) if def_type in ["Standard", "Professional", "Premium"] else 0, key=f"edit_sw_t_{c_id}_{i}")
                sw_s = c2.text_input(f"{i+1}. Seri No", value=def_s, key=f"edit_sw_s_{c_id}_{i}")
                sw_d = c3.date_input(f"{i+1}. Abonelik Bitiş", value=def_d, key=f"edit_sw_d_{c_id}_{i}")
                sw_edit_inputs.append({"type": sw_t, "serial": sw_s, "date": sw_d})
                
            if st.button("➕ SolidWorks Ekle", key=f"add_sw_{c_id}"):
                st.session_state[f"edit_sw_count_{c_id}"] += 1
                st.rerun()

            st.markdown("---")
            st.write("⚙️ **SolidCAM Lisansları**")
            sc_list = [l for l in curr_lics if l['software_type'].startswith('solidcam:')]
            if f"edit_sc_count_{c_id}" not in st.session_state:
                st.session_state[f"edit_sc_count_{c_id}"] = max(1, len(sc_list))
                
            sc_edit_inputs = []
            for i in range(st.session_state[f"edit_sc_count_{c_id}"]):
                existing_l = sc_list[i] if i < len(sc_list) else None
                def_mods, def_s, def_d = [], "", None
                if existing_l:
                    parts = existing_l['software_type'].split(":")
                    if len(parts) > 1: def_mods = [m.strip() for m in parts[1].split(",") if m.strip() in sc_module_options]
                    def_s = existing_l['serial_number']
                    def_d = str_to_date(existing_l.get('sub_date'))
                    
                c1, c2, c3 = st.columns(3)
                sc_m = c1.multiselect(f"{i+1}. Modüller", sc_module_options, default=def_mods, key=f"edit_sc_m_{c_id}_{i}")
                sc_s = c2.text_input(f"{i+1}. Seri No", value=def_s, key=f"edit_sc_s_{c_id}_{i}")
                sc_d = c3.date_input(f"{i+1}. Abonelik Bitiş", value=def_d, key=f"edit_sc_d_{c_id}_{i}")
                sc_edit_inputs.append({"modules": sc_m, "serial": sc_s, "date": sc_d})

            if st.button("➕ SolidCAM Ekle", key=f"add_sc_{c_id}"):
                st.session_state[f"edit_sc_count_{c_id}"] += 1
                st.rerun()

            st.markdown("---")
            st.write("⏳ **SolidCAM Deneme (Sadece Modül ve Bitiş Tarihi)**")
            sct_list = [l for l in curr_lics if l['software_type'].startswith('solidcam_deneme:')]
            if f"edit_sct_count_{c_id}" not in st.session_state:
                st.session_state[f"edit_sct_count_{c_id}"] = max(1, len(sct_list))

            sct_edit_inputs = []
            for i in range(st.session_state[f"edit_sct_count_{c_id}"]):
                existing_l = sct_list[i] if i < len(sct_list) else None
                def_mods, def_trial = [], None
                if existing_l:
                    parts = existing_l['software_type'].split(":")
                    if len(parts) > 1: def_mods = [m.strip() for m in parts[1].split(",") if m.strip() in sc_module_options]
                    def_trial = str_to_date(existing_l.get('trial_date'))

                c1, c2 = st.columns(2)
                sct_m = c1.multiselect(f"{i+1}. Deneme Modülleri", sc_module_options, default=def_mods, key=f"edit_sct_m_{c_id}_{i}")
                sct_t = c2.date_input(f"{i+1}. Deneme Bitiş Tarihi", value=def_trial, key=f"edit_sct_t_{c_id}_{i}")
                sct_edit_inputs.append({"modules": sct_m, "trial": sct_t})

            if st.button("➕ SolidCAM Deneme Ekle", key=f"add_sct_{c_id}"):
                st.session_state[f"edit_sct_count_{c_id}"] += 1
                st.rerun()

            st.markdown("---")
            b1, b2 = st.columns(2)
            if b1.button("💾 Değişiklikleri Kaydet", key=f"save_{c_id}", use_container_width=True):
                if e_name.lower() != company['name'].lower():
                    isim_kontrol = supabase.table("companies").select("id").ilike("name", e_name.lower()).execute()
                    if isim_kontrol.data:
                        st.error(f"⚠️ '{e_name.upper()}' isimli başka bir firma sistemde zaten kayıtlı!")
                        st.stop()

                degisenler = []
                if e_name.lower() != company['name'].lower(): degisenler.append("Firma Adı")
                if e_addr != company.get('address', ''): degisenler.append("Adres")
                if curr_con and e_c_name != curr_con[0]['full_name']: degisenler.append("Yetkili Adı")
                if curr_con and e_c_phone != curr_con[0]['phone']: degisenler.append("Telefon")
                if curr_note and e_note != curr_note[0]['note']: degisenler.append("Firma Notu")
                if e_file: degisenler.append("Yeni Dosya Eklendi")
                degisenler.append("Lisans Kayıtları") 
                
                detay_metni = ", ".join(degisenler) + " güncellendi."
                
                supabase.table("companies").update({
                    "name": e_name.lower(), "address": e_addr,
                    "last_edited_by": st.session_state.current_user,
                    "last_edit_details": detay_metni
                }).eq("id", c_id).execute()
                
                if curr_con: supabase.table("contacts").update({"full_name": e_c_name, "phone": e_c_phone}).eq("company_id", c_id).execute()
                else: supabase.table("contacts").insert({"company_id": c_id, "full_name": e_c_name, "phone": e_c_phone}).execute()
                
                if curr_note: supabase.table("company_notes").update({"note": e_note, "author": st.session_state.current_user}).eq("company_id", c_id).execute()
                elif e_note: supabase.table("company_notes").insert({"company_id": c_id, "author": st.session_state.current_user, "note": e_note}).execute()
                
                supabase.table("licenses").delete().eq("company_id", c_id).execute()
                
                for sw in sw_edit_inputs:
                    if sw['serial'] or sw['date']:
                        supabase.table("licenses").insert({
                            "company_id": c_id, "software_type": f"solidworks: {sw['type']}",
                            "serial_number": sw['serial'], "sub_date": str(sw['date']) if sw['date'] else None
                        }).execute()

                for sc in sc_edit_inputs:
                    if sc['serial'] or sc['date'] or sc['modules']:
                        mod_str = ", ".join(sc['modules']) if sc['modules'] else "Belirtilmedi"
                        supabase.table("licenses").insert({
                            "company_id": c_id, "software_type": f"solidcam: {mod_str}",
                            "serial_number": sc['serial'], "sub_date": str(sc['date']) if sc['date'] else None
                        }).execute()

                for sct in sct_edit_inputs:
                    if sct['trial'] or sct['modules']:
                        mod_str = ", ".join(sct['modules']) if sct['modules'] else "Belirtilmedi"
                        supabase.table("licenses").insert({
                            "company_id": c_id, "software_type": f"solidcam_deneme: {mod_str}",
                            "serial_number": "-", "trial_date": str(sct['trial']) if sct['trial'] else None
                        }).execute()

                if e_file:
                    fn = f"{uuid.uuid4()}_{dosya_adi_temizle(e_file.name)}"
                    supabase.storage.from_("firma postlari").upload(fn, e_file.getvalue(), file_options={"content-type": e_file.type})
                    supabase.table("company_files").insert({"company_id": c_id, "file_name": e_file.name, "file_url": f"{URL}/storage/v1/object/public/firma%20postlari/{fn}"}).execute()

                st.session_state.editing_id = None
                cleanup_edit_state(c_id)
                st.cache_data.clear() 
                st.rerun()
                
            if b2.button("❌ Vazgeç", key=f"cancel_{c_id}", use_container_width=True):
                st.session_state.editing_id = None
                cleanup_edit_state(c_id)
                st.rerun()

    # ================= 2. NORMAL GÖRÜNTÜLEME MODU =================
    else:
        with st.expander(f"🏢 {company['name'].upper()} Detayları", expanded=varsayilan_acik):
            if st.session_state.user_role == "admin" and company.get("last_edited_by"):
                yapilan_degisiklikler = company.get('last_edit_details', 'Belirtilmedi')
                st.info(f"🕵️‍♂️ **Admin Log:** Son işlem yapan: **{company['last_edited_by']}** \n📝 **Özet:** {yapilan_degisiklikler}")

            lic_res = company.get('licenses', [])
            col_info, col_lic = st.columns(2)
            
            with col_info:
                st.subheader("📞 İletişim & Notlar", anchor=False)
                for c in company.get('contacts', []): st.write(f"👤 **{c['full_name']}**: {c['phone']}")
                st.write(f"📍 {company.get('address', '-')}")
                for n in company.get('company_notes', []): st.info(f"**Yazan/Düzenleyen ({n['author']})**: {n['note']}")
                
                sct_list = [l for l in lic_res if l['software_type'].startswith('solidcam_deneme:')]
                if sct_list:
                    st.markdown("<br>", unsafe_allow_html=True)
                    st.subheader("⏳ SolidCAM Deneme Modülleri", anchor=False)
                    for l in sct_list:
                        mod = l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "Belirtilmedi"
                        st.write(f"🔹 **Modüller:** {mod}")
                        durum_yazdir("Deneme Bitişi", l.get('trial_date'))
            
            with col_lic:
                st.subheader("🔑 Lisanslar", anchor=False)
                if lic_res:
                    sw_list = [l for l in lic_res if l['software_type'].startswith('solidworks')]
                    sc_list = [l for l in lic_res if l['software_type'].startswith('solidcam:')]

                    if sw_list:
                        st.markdown("🛠️ **SOLIDWORKS**")
                        for l in sw_list:
                            tip = l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "Standard"
                            st.write(f"🔹 Tip: **{tip}** | No: `{l['serial_number']}`")
                            durum_yazdir("Abonelik", l.get('sub_date'))
                    
                    if sc_list:
                        st.markdown("⚙️ **SOLIDCAM**")
                        for l in sc_list:
                            mod = l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "Belirtilmedi"
                            st.write(f"🔹 Modül: **{mod}** | No: `{l['serial_number']}`")
                            durum_yazdir("Abonelik", l.get('sub_date'))
                            if l.get('trial_date'): durum_yazdir("Eski Deneme Kaydı", l.get('trial_date'))
                else:
                    st.warning("Lisans kaydı yok.")
                
                st.subheader("📁 Dosyalar", anchor=False)
                for f in company.get('company_files', []): st.link_button(f"📦 {f['file_name']}", f['file_url'])

            st.markdown("---")
            b1, b2, b3, _ = st.columns([1, 1, 1.5, 2.5])
            if b1.button("✏️ Düzenle", key=f"e_{suffix}_{c_id}"):
                st.session_state.editing_id = c_id
                st.rerun()
                
            if b2.button("🗑️ Sil", key=f"d_{suffix}_{c_id}"):
                supabase.table("companies").delete().eq("id", c_id).execute()
                st.cache_data.clear() 
                st.rerun()
                
            with b3:
                firma_verisi = []
                if lic_res:
                    for l in lic_res:
                        firma_verisi.append({
                            "Firma Adı": company['name'].upper(),
                            "Yazılım Tipi": l['software_type'].split(":")[0].upper().replace("_", " "),
                            "Lisans/Modül Tipi": l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "-",
                            "Seri No": l['serial_number'],
                            "Abonelik Bitiş": l.get('sub_date', '-'),
                            "Deneme Bitiş": l.get('trial_date', '-')
                        })
                else:
                    firma_verisi.append({"Firma Adı": company['name'].upper(), "Yazılım Tipi": "Kayıt Yok", "Lisans/Modül Tipi": "-", "Seri No": "-", "Abonelik Bitiş": "-", "Deneme Bitiş": "-"})
                    
                df_tekil = pd.DataFrame(firma_verisi)
                output_tekil = io.BytesIO()
                with pd.ExcelWriter(output_tekil, engine='xlsxwriter') as writer:
                    df_tekil.to_excel(writer, index=False, sheet_name='Firma Detay', header=False, startrow=1)
                    workbook = writer.book
                    worksheet = writer.sheets['Firma Detay']
                    worksheet.add_table(0, 0, df_tekil.shape[0], df_tekil.shape[1] - 1, {'columns': [{'header': col} for col in df_tekil.columns], 'style': 'Table Style Medium 2'})
                    worksheet.set_column(0, df_tekil.shape[1] - 1, 25)
                    
                st.download_button(label="📥 Excel'e Aktar", data=output_tekil.getvalue(), file_name=f"{company['name']}_lisans.xlsx", mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", key=f"dl_excel_{suffix}_{c_id}")

# --- YAN MENÜ (SIDEBAR) VE UYARILAR ---
uyarilar = []
if tum_lisanslar_data:
    for l in tum_lisanslar_data:
        c_n = l.get('companies', {}).get('name', 'Bilinmeyen') if l.get('companies') else 'Bilinmeyen'
        
        if l['software_type'].startswith('solidcam_deneme:'):
            k = kalan_gun_bul(l.get('trial_date'))
            if k is not None and k <= 30:
                uyarilar.append(f"🔴 **{c_n.upper()}** - SOLIDCAM DENEME Bitiş ({k} gün)")
        else:
            yazilim_adi = l['software_type'].split(":")[0].upper()
            for t, v in [("Abonelik", l.get('sub_date')), ("Deneme", l.get('trial_date'))]:
                k = kalan_gun_bul(v)
                if k is not None and k <= 30:
                    uyarilar.append(f"🔴 **{c_n.upper()}** - {yazilim_adi} {t} ({k} gün)")

with st.sidebar:
    st.header(f"👤 {st.session_state.current_user.upper()}", anchor=False)
    if st.button("🚪 Çıkış Yap", use_container_width=True):
        st.session_state.logged_in = False
        st.cache_data.clear()
        st.rerun()
    if uyarilar:
        st.warning("🔔 **KRİTİK UYARILAR**")
        for u in uyarilar: st.write(u)

# --- ANA DASHBOARD KUTULARI VE GRAFİKLER ---
st.title("📂 Şirket Lisans & Yönetim Paneli", anchor=False)

m1, m2, m3, m4 = st.columns(4)
m1.metric("🏢 Toplam Firma", len(tum_firmalar_data))
m2.metric("🛠️ SolidWorks Sayısı", sum(1 for l in tum_lisanslar_data if l['software_type'].startswith('solidworks')))
m3.metric("⚙️ SolidCAM Sayısı", sum(1 for l in tum_lisanslar_data if l['software_type'].startswith('solidcam:')))
m4.metric("🚨 Kritik Uyarılar", len(uyarilar))

st.markdown("### 📊 Genel Dağılım İstatistikleri")
g1, g2 = st.columns(2)

with g1:
    sw_counts = {}
    for l in tum_lisanslar_data:
        if "solidworks" in l['software_type']:
            t = l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "Standard"
            sw_counts[t] = sw_counts.get(t, 0) + 1
    if sw_counts:
        fig_sw = px.pie(names=list(sw_counts.keys()), values=list(sw_counts.values()), title="SolidWorks Tip Dağılımı", hole=0.4)
        fig_sw.update_traces(hovertemplate='%{value}<extra></extra>')
        st.plotly_chart(fig_sw, use_container_width=True, config={'displayModeBar': False})
    else:
        st.info("Henüz SolidWorks verisi girilmemiş.")

with g2:
    sc_mods = {}
    for l in tum_lisanslar_data:
        if l['software_type'].startswith('solidcam:'):
            mods = l['software_type'].split(":")[1].strip().split(",") if ":" in l['software_type'] else []
            for m in mods:
                m = m.strip()
                if m and m != "Belirtilmedi":
                    sc_mods[m] = sc_mods.get(m, 0) + 1
    if sc_mods:
        df_sc = pd.DataFrame(list(sc_mods.items()), columns=['Modül', 'Adet']).sort_values('Adet', ascending=False)
        fig_sc = px.bar(df_sc, x='Modül', y='Adet', title="SolidCAM En Çok Kullanılan Modüller", text='Adet')
        fig_sc.update_traces(hovertemplate='<b>%{x}</b><br>Adet: %{y}<extra></extra>')
        st.plotly_chart(fig_sc, use_container_width=True, config={'displayModeBar': False})
    else:
        st.info("Henüz SolidCAM modül verisi girilmemiş.")

st.markdown("---")

# --- SEKMELER ---
tab_names = ["🔍 Sorgula", "📋 Tüm Firmalar", "➕ Yeni Ekle"]
if st.session_state.user_role == "admin": tab_names.append("👥 Kullanıcı Yönetimi")
tabs = st.tabs(tab_names)

# TAB 1: SORGULA
with tabs[0]:
    sq = st.text_input("Şirket adı:", "").lower()
    if sq:
        bulunanlar = [c for c in tum_firmalar_data if sq in c['name'].lower()]
        if bulunanlar:
            for c in bulunanlar: firma_detay_goster(c, "search", True)
        else: st.error("Kayıt bulunamadı.")

# TAB 2: LİSTE VE EXCEL İNDİRME
with tabs[1]:
    if st.button("📥 Profesyonel Excel Raporu Al"):
        if tum_lisanslar_data:
            df = pd.DataFrame([
                {
                    "Firma Adı": (l.get('companies', {}).get('name', 'Bilinmeyen') if l.get('companies') else 'Bilinmeyen').upper(),
                    "Yazılım Tipi": l['software_type'].split(":")[0].upper().replace("_", " "),
                    "Lisans/Modül Tipi": l['software_type'].split(":")[1].strip() if ":" in l['software_type'] else "-",
                    "Lisans Anahtarı": l['serial_number'],
                    "Abonelik Bitiş": l.get('sub_date', '-'),
                    "Deneme Bitiş": l.get('trial_date', '-')
                } for l in tum_lisanslar_data
            ])
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Lisans Raporu', header=False, startrow=1)
                workbook = writer.book
                worksheet = writer.sheets['Lisans Raporu']
                worksheet.add_table(0, 0, df.shape[0], df.shape[1] - 1, {'columns': [{'header': col} for col in df.columns], 'style': 'Table Style Medium 2'})
                worksheet.set_column(0, df.shape[1] - 1, 25)
            st.download_button(label="📥 Excel Dosyasını Bilgisayarına İndir", data=output.getvalue(), file_name=f"Lisans_Raporu_{datetime.now().strftime('%Y%m%d')}.xlsx", mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        else:
            st.warning("İndirilecek veri bulunamadı.")
            
    for c in tum_firmalar_data: firma_detay_goster(c, "list", False)

# TAB 3: YENİ KAYIT FORMU
with tabs[2]:
    with st.container():
        fk = st.session_state.form_reset_key 
        
        c1, c2 = st.columns(2)
        with c1:
            f_n = st.text_input("Firma Adı*", key=f"new_f_n_{fk}")
            f_a = st.text_area("Adres", key=f"new_f_a_{fk}")
            c_p = st.text_input("Yetkili Adı", key=f"new_c_p_{fk}")
            c_t = st.text_input("Yetkili Telefon", key=f"new_c_t_{fk}")
        with c2:
            f_o = st.text_area("Not", key=f"new_f_o_{fk}")
            u_f = st.file_uploader("Dosya Yükle", key=f"new_u_f_{fk}")
            
        st.markdown("---")
        st.write("🛠️ **SolidWorks Lisansları**")
        sw_inputs = []
        for i in range(st.session_state.new_sw_count):
            col1, col2, col3 = st.columns(3)
            sw_t = col1.selectbox(f"{i+1}. Lisans Tipi", ["Standard", "Professional", "Premium"], key=f"new_sw_t_{fk}_{i}")
            sw_s = col2.text_input(f"{i+1}. Seri No", key=f"new_sw_s_{fk}_{i}")
            sw_d = col3.date_input(f"{i+1}. Abonelik Bitiş", value=None, key=f"new_sw_d_{fk}_{i}")
            sw_inputs.append({"type": sw_t, "serial": sw_s, "date": sw_d})
            
        if st.button("➕ Yeni SolidWorks Ekle", key=f"new_sw_btn_{fk}"):
            st.session_state.new_sw_count += 1
            st.rerun()

        st.markdown("---")
        st.write("⚙️ **SolidCAM Lisansları**")
        sc_inputs = []
        for i in range(st.session_state.new_sc_count):
            col1, col2, col3 = st.columns(3)
            sc_m = col1.multiselect(f"{i+1}. Modüller", sc_module_options, key=f"new_sc_m_{fk}_{i}")
            sc_s = col2.text_input(f"{i+1}. Seri No", key=f"new_sc_s_{fk}_{i}")
            sc_d = col3.date_input(f"{i+1}. Abonelik Bitiş", value=None, key=f"new_sc_d_{fk}_{i}")
            sc_inputs.append({"modules": sc_m, "serial": sc_s, "date": sc_d})
            
        if st.button("➕ Yeni SolidCAM Ekle", key=f"new_sc_btn_{fk}"):
            st.session_state.new_sc_count += 1
            st.rerun()
            
        st.markdown("---")
        st.write("⏳ **SolidCAM Deneme (Sadece Modül ve Bitiş Tarihi)**")
        sct_inputs = []
        for i in range(st.session_state.new_sct_count):
            col1, col2 = st.columns(2)
            sct_m = col1.multiselect(f"{i+1}. Deneme Modülleri", sc_module_options, key=f"new_sct_m_{fk}_{i}")
            sct_t = col2.date_input(f"{i+1}. Deneme Bitiş Tarihi", value=None, key=f"new_sct_t_{fk}_{i}")
            sct_inputs.append({"modules": sct_m, "trial": sct_t})
            
        if st.button("➕ Yeni SolidCAM Deneme Ekle", key=f"new_sct_btn_{fk}"):
            st.session_state.new_sct_count += 1
            st.rerun()

        st.markdown("---")
        if st.button("🚀 Bilgileri Kaydet", use_container_width=True, key=f"save_new_btn_{fk}"):
            if f_n:
                if any(f_n.lower() == c['name'].lower() for c in tum_firmalar_data):
                    st.error(f"⚠️ '{f_n.upper()}' isimli firma sistemde zaten kayıtlı! Lütfen 'Tüm Firmalar' sekmesinden mevcut firmayı düzenleyin.")
                else:
                    t_id = supabase.table("companies").insert({
                        "name": f_n.lower(), "address": f_a,
                        "last_edited_by": st.session_state.current_user,
                        "last_edit_details": "Sistemde ilk kez oluşturuldu."
                    }).execute().data[0]['id']
                    
                    for sw in sw_inputs:
                        if sw['serial'] or sw['date']:
                            supabase.table("licenses").insert({
                                "company_id": t_id, "software_type": f"solidworks: {sw['type']}",
                                "serial_number": sw['serial'], "sub_date": str(sw['date']) if sw['date'] else None
                            }).execute()

                    for sc in sc_inputs:
                        if sc['serial'] or sc['date'] or sc['modules']:
                            mod_str = ", ".join(sc['modules']) if sc['modules'] else "Belirtilmedi"
                            supabase.table("licenses").insert({
                                "company_id": t_id, "software_type": f"solidcam: {mod_str}",
                                "serial_number": sc['serial'], "sub_date": str(sc['date']) if sc['date'] else None
                            }).execute()
                            
                    for sct in sct_inputs:
                        if sct['trial'] or sct['modules']:
                            mod_str = ", ".join(sct['modules']) if sct['modules'] else "Belirtilmedi"
                            supabase.table("licenses").insert({
                                "company_id": t_id, "software_type": f"solidcam_deneme: {mod_str}",
                                "serial_number": "-", "trial_date": str(sct['trial']) if sct['trial'] else None
                            }).execute()
                            
                    if c_p: supabase.table("contacts").insert({"company_id": t_id, "full_name": c_p, "phone": c_t}).execute()
                    if f_o: supabase.table("company_notes").insert({"company_id": t_id, "author": st.session_state.current_user, "note": f_o}).execute()
                    if u_f:
                        fn = f"{uuid.uuid4()}_{dosya_adi_temizle(u_f.name)}"
                        supabase.storage.from_("firma postlari").upload(fn, u_f.getvalue(), file_options={"content-type": u_f.type})
                        supabase.table("company_files").insert({"company_id": t_id, "file_name": u_f.name, "file_url": f"{URL}/storage/v1/object/public/firma%20postlari/{fn}"}).execute()
                    
                    st.session_state.new_sw_count = 1
                    st.session_state.new_sc_count = 1
                    st.session_state.new_sct_count = 1
                    st.session_state.form_reset_key += 1 
                    
                    st.cache_data.clear() 
                    st.success("Tebrikler, kayıt başarıyla oluşturuldu!")
                    st.rerun()
            else:
                st.warning("Lütfen bir firma adı girin!")

# TAB 4: KULLANICI YÖNETİMİ (Sadece Admin Görür)
if st.session_state.user_role == "admin":
    with tabs[3]:
        
        st.subheader("👥 Mevcut Kullanıcılar", anchor=False)
        for u in tum_kullanicilar:
            col_u1, col_u2, col_u3 = st.columns([2, 2, 1])
            col_u1.write(f"👤 **{u['users']}**")
            col_u2.write(f"Yetki: `{u['role']}`")
            
            if u['users'] != st.session_state.current_user:
                if col_u3.button("🗑️ Sil", key=f"del_user_{u['id']}"):
                    supabase.table("users").delete().eq("id", u['id']).execute()
                    st.cache_data.clear()
                    st.success(f"{u['users']} kullanıcısı silindi.")
                    st.rerun()
            else:
                col_u3.write("*(Mevcut Oturum)*")
                
        st.markdown("---")
        st.subheader("➕ Yeni Kullanıcı Ekle", anchor=False)
        with st.form("new_user_form", clear_on_submit=True):
            un = st.text_input("Yeni Kullanıcı Adı")
            up = st.text_input("Şifre Belirle", type="password")
            ur = st.selectbox("Yetki Türü", ["personel", "admin"])
            if st.form_submit_button("Hesabı Oluştur"):
                if any(un.lower() == k['users'].lower() for k in tum_kullanicilar):
                    st.error("Bu kullanıcı adı zaten mevcut!")
                elif len(up) < 3:
                    st.warning("Şifre en az 3 karakter olmalıdır.")
                else:
                    supabase.table("users").insert({"users": un, "password": up, "role": ur}).execute()
                    st.cache_data.clear()
                    st.success("Kullanıcı Eklendi!")
                    st.rerun()
