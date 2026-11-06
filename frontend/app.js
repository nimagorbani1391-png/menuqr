const API_BASE = 'https://menuqr-8v3o.onrender.com/api'; 
let token = localStorage.getItem('menuqr_token');
let currentSlug = '';
let userRestaurantName = '';

if (token) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    initDashboard();
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
    try { data = await res.json(); } catch(e) { throw new Error("سرور پاسخ نداد. لطفا چند دقیقه صبر کنید."); }
    if (!res.ok) throw new Error(data.message || 'خطا در ثبت‌نام');
    
    alert('✅ حساب ساخته شد! حالا با ایمیل و رمز خود وارد شوید.');
    toggleAuth(); 
    document.getElementById('email').value = email;
  } catch (error) {
    err.innerText = error.message; err.classList.remove('hidden');
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
    initDashboard();
  } catch (error) {
    err.innerText = error.message; err.classList.remove('hidden');
  } finally {
    btn.innerText = 'ورود به پنل'; btn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem('menuqr_token');
  location.reload();
}

function initDashboard() {
    fetchUserData(); 
    fetchCategories();
    fetchItems();
}

function showView(viewId) {
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-foods').classList.add('hidden');
    document.getElementById('view-categories').classList.add('hidden');
    document.getElementById('view-qr').classList.add('hidden');

    const tabs = ['tab-dashboard', 'tab-foods', 'tab-categories', 'tab-qr'];
    tabs.forEach(t => {
        const el = document.getElementById(t);
        if(el) {
            el.classList.remove('active-tab');
            el.classList.add('text-slate-600');
        }
    });

    document.getElementById(viewId).classList.remove('hidden');

    let activeTabId = '';
    if(viewId === 'view-dashboard') activeTabId = 'tab-dashboard';
    if(viewId === 'view-foods') activeTabId = 'tab-foods';
    if(viewId === 'view-categories') activeTabId = 'tab-categories';
    if(viewId === 'view-qr') activeTabId = 'tab-qr';
    
    const activeTabEl = document.getElementById(activeTabId);
    if(activeTabEl) {
        activeTabEl.classList.add('active-tab');
        activeTabEl.classList.remove('text-slate-600');
    }
}

async function fetchUserData() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) { logout(); return; }
        const user = await res.json();
        
        currentSlug = user.slug;
        userRestaurantName = user.restaurantName;
        
        document.getElementById('dash-restaurant-name').innerText = user.restaurantName || 'رستوران شما';
        document.getElementById('dash-user-name').innerText = user.name;
        
        generateQR(currentSlug);
    } catch (e) {
        console.error(e);
    }
}

function openPublicMenu() {
    // ساخت یک لینک مجازی برای باز شدن سریع‌تر و مطمئن‌تر
    const link = document.createElement('a');
    link.href = `menu.html?slug=${currentSlug}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} {
    window.open(`menu.html?slug=${currentSlug}`, '_blank');
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const cats = await res.json();
    
    document.getElementById('stat-cats').innerText = cats.length;

    const list = document.getElementById('cats-list');
    if(cats.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-400 text-sm py-4">هنوز دسته‌بندی نساخته‌اید.</p>';
    } else {
        list.innerHTML = cats.map(c => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="font-bold text-slate-700 text-sm">${c.name}</span>
            </div>
        `).join('');
    }

    const select = document.getElementById('item-cat');
    select.innerHTML = '<option value="">انتخاب کنید...</option>' + 
      cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
      
  } catch (e) { console.error('خطا در گرفتن دسته‌بندی‌ها'); }
}

async function addCategory() {
  const name = document.getElementById('cat-name').value;
  if(!name) return alert("اسم دسته‌بندی را بنویسید");
  
  try {
    await fetch(`${API_BASE}/categories`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ name }) 
    });
    document.getElementById('cat-name').value = '';
    fetchCategories(); 
  } catch (err) { alert('خطا در ساخت دسته‌بندی'); }
}

// ⚠️ بخش دوم (کدهای غذاها و QR) را دقیقاً زیر این خط اضافه کنید
function generateQR(slug) {
  const menuUrl = `${window.location.origin}/menu.html?slug=${slug}`;
  const container = document.getElementById('qrcode-container');
  container.innerHTML = ''; 
  try {
    if (typeof QRCode !== 'undefined') new QRCode(container, { text: menuUrl, width: 180, height: 180, colorDark : "#4f46e5" });
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

async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE}/items`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const items = await res.json();
    
    document.getElementById('stat-foods').innerText = items.length;

    const list = document.getElementById('items-list');
    if (items.length === 0) { 
        list.innerHTML = '<p class="p-6 text-center text-slate-500">هنوز غذایی به منو اضافه نکردی.</p>'; 
        return; 
    }
    
    list.innerHTML = items.map(item => `
      <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
        <div class="flex items-center gap-4">
          ${item.image ? `<img src="${item.image.startsWith('http') ? item.image : API_BASE.replace('/api','') + item.image}" loading="lazy" class="w-16 h-16 rounded-xl object-cover shadow-sm">` : `<div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">بدون عکس</div>`}
          <div>
            <p class="font-bold text-slate-800 text-lg ${!item.isActive ? 'text-slate-400 line-through' : ''}">${item.name}</p>
            <p class="text-sm font-bold text-indigo-600">${item.price.toLocaleString()} تومان</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="toggleItem('${item._id}')" class="px-4 py-2 rounded-xl text-xs font-bold transition-colors ${item.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}">
            ${item.isActive ? 'ناموجود کن' : 'موجود کن'}
          </button>
          <button onclick="deleteItem('${item._id}')" class="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            حذف
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error(e); }
}

function openAddFoodModal() {
    document.getElementById('add-food-modal').classList.remove('hidden');
}

function closeAddFoodModal() {
    document.getElementById('add-food-modal').classList.add('hidden');
}

async function addItem() {
  const name = document.getElementById('item-name').value;
  const price = document.getElementById('item-price').value;
  const category = document.getElementById('item-cat').value;
  
  if(!name || !price || !category) return alert("فیلدهای ضروری (نام، قیمت، دسته‌بندی) را پر کنید");
  
  const formData = new FormData();
  formData.append('name', name); 
  formData.append('price', price); 
  formData.append('category', category); 
  formData.append('description', document.getElementById('item-desc').value);
  
  const file = document.getElementById('item-image').files[0];
  if (file) formData.append('image', file);

  const btn = document.getElementById('btn-add-item');
  btn.innerText = 'در حال ذخیره...'; btn.disabled = true;
  
  try {
    const res = await fetch(`${API_BASE}/items`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if(!res.ok) throw new Error('خطا در ذخیره');
    
    document.getElementById('item-name').value = ''; 
    document.getElementById('item-price').value = ''; 
    document.getElementById('item-desc').value = '';
    document.getElementById('item-image').value = '';
    
    closeAddFoodModal();
    fetchItems(); 
  } catch(e) { 
      alert('خطا در اضافه کردن غذا'); 
  } finally { 
      btn.innerText = 'افزودن به منو'; btn.disabled = false; 
  }
}

async function toggleItem(id) {
  try {
    await fetch(`${API_BASE}/items/${id}/toggle`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchItems();
  } catch (e) { alert('خطا در تغییر وضعیت'); }
}

async function deleteItem(id) {
  if(!confirm('مطمئنی می‌خوای این غذا رو پاک کنی؟')) return;
  try {
    await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchItems();
  } catch (e) { alert('خطا در حذف'); }
}
