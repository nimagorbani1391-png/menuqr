const API_BASE = 'https://menuqr-8v3o.onrender.com/api'; 
let token = localStorage.getItem('menuqr_token');
let currentSlug = '';

if (token) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    fetchUserData();
    fetchCategories();
    fetchItems();
}

function toggleAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authTitle = document.getElementById('auth-title');
  const toggleBtn = document.getElementById('toggle-auth');
  document.getElementById('auth-error').classList.add('hidden');

  if(loginForm.classList.contains('hidden')) {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.innerText = 'ورود به MenuQR';
    toggleBtn.innerText = 'حساب ندارید؟ ثبت‌نام کنید';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.innerText = 'ثبت‌نام در MenuQR';
    toggleBtn.innerText = 'حساب دارید؟ وارد شوید';
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value;
  const restaurantName = document.getElementById('reg-restaurant').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  if(!name || !restaurantName || !email || !password) return alert("لطفا همه فیلدها را پر کنید.");

  const btn = document.getElementById('btn-register');
  const err = document.getElementById('auth-error');
  btn.innerText = 'در حال ساخت...'; btn.disabled = true; err.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, restaurantName, email, password })
    });
    let data;
    try { data = await res.json(); } catch(e) { throw new Error("سرور پاسخ نداد. لطفا چند دقیقه صبر کنید (سرور در حال بیدار شدن است)."); }
    if (!res.ok) throw new Error(data.message || 'خطا در ثبت‌نام');
    
    alert('✅ حساب ساخته شد! حالا با ایمیل و رمز خود وارد شوید.');
    toggleAuth(); 
    document.getElementById('email').value = email;
  } catch (error) {
    err.innerText = error.message; err.classList.remove('hidden');
    err.scrollIntoView({behavior: "smooth", block: "center"});
  } finally {
    btn.innerText = 'ساخت حساب جدید'; btn.disabled = false;
  }
}

async function doLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if(!email || !password) return alert("لطفا ایمیل و رمز عبور را وارد کنید.");

  const btn = document.getElementById('btn-login');
  const err = document.getElementById('auth-error');
  btn.innerText = 'در حال بررسی...'; btn.disabled = true; err.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    let data;
    try { data = await res.json(); } catch(e) { throw new Error("سرور پاسخ نداد. (سرور در حال بیدار شدن است)."); }
    if (!res.ok) throw new Error(data.message || 'ایمیل یا رمز اشتباه است');
    
    token = data.token;
    localStorage.setItem('menuqr_token', token);
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    fetchUserData(); fetchCategories(); fetchItems();
  } catch (error) {
    err.innerText = error.message; err.classList.remove('hidden');
    err.scrollIntoView({behavior: "smooth", block: "center"});
  } finally {
    btn.innerText = 'ورود به پنل'; btn.disabled = false;
  }
}

async function fetchUserData() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const user = await res.json();
    currentSlug = user.slug;
    generateQR(currentSlug);
  } catch (e) { generateQR('e7185c4e'); }
}

function generateQR(slug) {
  const menuUrl = `${window.location.origin}/menu.html?slug=${slug}`;
  const container = document.getElementById('qrcode-container');
  container.innerHTML = ''; 
  try {
    if (typeof QRCode !== 'undefined') new QRCode(container, { text: menuUrl, width: 128, height: 128, colorDark : "#4f46e5" });
  } catch(e) {}
}

function downloadQR() {
  const img = document.querySelector('#qrcode-container img');
  const canvas = document.querySelector('#qrcode-container canvas');
  const link = document.createElement('a');
  link.download = 'menu-qr.png';
  if(img) { link.href = img.src; link.click(); }
  else if(canvas) { link.href = canvas.toDataURL("image/png"); link.click(); }
}

function logout() {
  localStorage.removeItem('menuqr_token');
  location.reload();
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
    const cats = await res.json();
    document.getElementById('item-cat').innerHTML = '<option value="">لطفا یک دسته‌بندی انتخاب کنید...</option>' + cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  } catch (e) {}
}

async function addCategory() {
  const name = document.getElementById('cat-name').value;
  if(!name) return alert("اسم دسته‌بندی را بنویسید");
  const btn = document.getElementById('btn-add-cat');
  btn.innerText = '...'; btn.disabled = true;
  try {
    await fetch(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name }) });
    document.getElementById('cat-name').value = '';
    fetchCategories(); alert("دسته‌بندی اضافه شد");
  } catch (err) { alert('خطا'); } finally { btn.innerText = 'افزودن'; btn.disabled = false; }
}

async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE}/items`, { headers: { 'Authorization': `Bearer ${token}` } });
    const items = await res.json();
    const list = document.getElementById('items-list');
    if (items.length === 0) { list.innerHTML = '<p class="text-center text-slate-400">غذایی نیست.</p>'; return; }
    list.innerHTML = items.map(item => `
      <div class="flex items-center justify-between p-3 border-b">
        <div class="flex items-center gap-4">
          ${item.image ? `<img src="${API_BASE.replace('/api','')}${item.image}" class="w-14 h-14 rounded-xl object-cover">` : `<div class="w-14 h-14 bg-slate-100 rounded-xl"></div>`}
          <div>
            <p class="font-bold text-sm ${!item.isActive ? 'text-gray-400 line-through' : ''}">${item.name}</p>
            <p class="text-xs text-indigo-600">${item.price.toLocaleString()} تومان</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="toggleItem('${item._id}')" class="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">${item.isActive ? 'ناموجود' : 'موجود'}</button>
          <button onclick="deleteItem('${item._id}')" class="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">حذف</button>
        </div>
      </div>
    `).join('');
  } catch(e) {}
}

async function addItem() {
  const name = document.getElementById('item-name').value;
  const price = document.getElementById('item-price').value;
  const category = document.getElementById('item-cat').value;
  if(!name || !price || !category) return alert("فیلدهای ضروری را پر کنید");
  
  const formData = new FormData();
  formData.append('name', name); formData.append('price', price); formData.append('category', category); formData.append('description', document.getElementById('item-desc').value);
  const file = document.getElementById('item-image').files[0];
  if (file) formData.append('image', file);

  const btn = document.getElementById('btn-add-item');
  btn.innerText = 'در حال ذخیره...'; btn.disabled = true;
  try {
    await fetch(`${API_BASE}/items`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    document.getElementById('item-name').value = ''; document.getElementById('item-price').value = ''; 
    fetchItems(); alert("غذا اضافه شد");
  } catch(e) { alert('خطا در اضافه کردن غذا'); } finally { btn.innerText = 'افزودن به منو'; btn.disabled = false; }
}

async function toggleItem(id) {
  await fetch(`${API_BASE}/items/${id}/toggle`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
  fetchItems();
}

async function deleteItem(id) {
  if(!confirm('مطمئنی؟')) return;
  await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  fetchItems();
      }
