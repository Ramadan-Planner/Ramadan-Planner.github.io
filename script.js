// Complete JavaScript File - Add this to the existing JS

let currentUser = null;
let currentTheme = 'light';

// Initialize everything when page loads
window.onload = () => {
  initTheme();
  
  const savedUser = localStorage.getItem("currentUser");
  if(savedUser){
    currentUser = savedUser;
    showPlanner();
  }
  
  // Set today's date
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = today.toLocaleDateString('bn-BD', options);
  document.getElementById('today-date').textContent = dateStr;
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      logoutUser();
    }
  });
};

// Theme System
function initTheme() {
  const savedTheme = localStorage.getItem('ramadan_theme');
  if (savedTheme) {
    currentTheme = savedTheme;
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('ramadan_theme', theme);
  
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    if (theme === 'dark') {
      themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
      themeBtn.title = "লাইট মোড";
    } else {
      themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
      themeBtn.title = "ডার্ক মোড";
    }
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showNotificationPopup('থিম পরিবর্তন', 
    newTheme === 'dark' ? 'ডার্ক মোড চালু হয়েছে' : 'লাইট মোড চালু হয়েছে');
}

// Authentication Functions
function showSignUp(){
  document.getElementById("login-page").style.display="none";
  document.getElementById("signup-page").style.display="block";
  document.getElementById("login-msg").innerText="";
}

function showLogin(){
  document.getElementById("signup-page").style.display="none";
  document.getElementById("login-page").style.display="block";
  document.getElementById("signup-msg").innerText="";
}

function signupUser(){
  const email = document.getElementById("signup-email").value.trim();
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const msg = document.getElementById("signup-msg");

  if(!email || !username || !password){
    msg.innerText = "সব তথ্য পূরণ করুন।";
    msg.style.color="red";
    return;
  }

  if(localStorage.getItem(username)){
    msg.innerText = "এই ইউজারনেম ইতিমধ্যে আছে!";
    msg.style.color="red";
    return;
  }

  localStorage.setItem(username, JSON.stringify({email,password}));
  msg.style.color="#10b981";
  msg.innerText="রেজিস্ট্রেশন সফল! লগইন পেইজে যাচ্ছে...";

  setTimeout(()=>{
    showLogin();
    document.getElementById("login-username").value=username;
    document.getElementById("login-password").value="";
    document.getElementById("login-msg").innerText="রেজিস্ট্রেশন সফল! এখন লগইন করুন।";
  },1500);
}

function loginUser(){
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const msg = document.getElementById("login-msg");

  const stored = localStorage.getItem(username);
  if(!stored){ 
    msg.innerText="ইউজারনেম পাওয়া যায়নি। রেজিস্ট্রেশন করুন।"; 
    msg.style.color="red"; 
    return; 
  }

  const userObj = JSON.parse(stored);
  if(userObj.password!==password){ 
    msg.innerText="পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।"; 
    msg.style.color="red"; 
    return; 
  }

  currentUser = username;
  localStorage.setItem("currentUser", currentUser);
  showPlanner();
}

function showPlanner(){
  document.getElementById("login-page").style.display="none";
  document.getElementById("signup-page").style.display="none";
  document.getElementById("planner-page").style.display="block";
  document.getElementById("welcome-msg").innerText=`স্বাগতম, ${currentUser}!`;

  loadCheckboxes();
  loadNotes();
  renderHabits();
  updateProgress();
}

function logoutUser(){
  if(notificationInterval) {
    clearInterval(notificationInterval);
  }
  localStorage.removeItem("currentUser");
  currentUser = null;
  document.getElementById("planner-page").style.display="none";
  document.getElementById("login-page").style.display="block";
  document.getElementById("login-msg").innerText="";
}

// Checkbox System
const dailyTasks = ["intention","ayat","surah","sunnah","dua","hadith","reflection1","reflection2","gratitude","special-day"];
const habitTasks = ["default-habit1","default-habit2","default-habit3","default-habit4"];
const premiumTasks = ["premium1","premium2"];
const allTasks = [...dailyTasks, ...habitTasks, ...premiumTasks];

function loadCheckboxes(){
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  
  allCheckboxes.forEach(cb => {
    const id = cb.id;
    if (!id) return;
    
    const key = `user_${currentUser}_${id}`;
    const saved = localStorage.getItem(key);
    
    if(saved === "true") {
      cb.checked = true;
      cb.parentElement.classList.add('checked');
    } else {
      cb.checked = false;
      cb.parentElement.classList.remove('checked');
    }
    
    // Add event listener
    cb.addEventListener("change", function() {
      const currentKey = `user_${currentUser}_${this.id}`;
      localStorage.setItem(currentKey, this.checked);
      
      if(this.checked) {
        this.parentElement.classList.add('checked');
        playSuccessSound();
      } else {
        this.parentElement.classList.remove('checked');
      }
      
      updateProgress();
    });
  });
}

// Progress Tracking
function updateProgress() {
  if (!currentUser) return;
  
  let dailyCompleted = 0;
  let habitCompleted = 0;
  let premiumCompleted = 0;
  let totalCompleted = 0;
  
  dailyTasks.forEach(id => {
    const key = `user_${currentUser}_${id}`;
    if (localStorage.getItem(key) === "true") dailyCompleted++;
  });
  
  habitTasks.forEach(id => {
    const key = `user_${currentUser}_${id}`;
    if (localStorage.getItem(key) === "true") habitCompleted++;
  });
  
  premiumTasks.forEach(id => {
    const key = `user_${currentUser}_${id}`;
    if (localStorage.getItem(key) === "true") premiumCompleted++;
  });
  
  totalCompleted = dailyCompleted + habitCompleted + premiumCompleted;
  const totalTasks = allTasks.length;
  const percentage = Math.round((totalCompleted / totalTasks) * 100);
  
  // Update circular progress
  const circle = document.querySelector('.progress-ring-circle');
  if (circle) {
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }
  
  // Update percentage text
  const progressPercentage = document.getElementById('progress-percentage');
  if (progressPercentage) {
    progressPercentage.textContent = percentage + '%';
  }
  
  // Update progress bars
  const dailyProgress = document.getElementById('daily-progress');
  const habitProgress = document.getElementById('habit-progress');
  const premiumProgress = document.getElementById('premium-progress');
  
  if (dailyProgress) dailyProgress.style.width = (dailyCompleted/dailyTasks.length*100) + '%';
  if (habitProgress) habitProgress.style.width = (habitCompleted/habitTasks.length*100) + '%';
  if (premiumProgress) premiumProgress.style.width = (premiumCompleted/premiumTasks.length*100) + '%';
  
  // Update counts
  document.getElementById('daily-count').textContent = `${dailyCompleted}/${dailyTasks.length}`;
  document.getElementById('habit-count').textContent = `${habitCompleted}/${habitTasks.length}`;
  document.getElementById('premium-count').textContent = `${premiumCompleted}/${premiumTasks.length}`;
  
  // Update progress message
  const messageElement = document.getElementById('progress-message');
  if (messageElement) {
    let message = "";
    let icon = "fas fa-bullhorn";
    
    if (percentage === 0) {
      message = "আজকের যাত্রা শুরু করুন! প্রথম টাস্ক টিক করুন।";
      icon = "fas fa-flag";
    } else if (percentage < 25) {
      message = "চলুন, একটু একটু করে এগোই! আল্লাহ আপনার সহায় হোন।";
      icon = "fas fa-seedling";
    } else if (percentage < 50) {
      message = "ভালো চলছে! আজকে আরও কিছু টাস্ক কমপ্লিট করুন।";
      icon = "fas fa-thumbs-up";
    } else if (percentage < 75) {
      message = "অর্ধেকের বেশি হয়ে গেছে! আপনি অসাধারণ করছেন।";
      icon = "fas fa-star";
    } else if (percentage < 100) {
      message = "প্রায় শেষ! শুধু আর কিছুটা বাকি।";
      icon = "fas fa-trophy";
    } else {
      message = "মাশাআল্লাহ! আজকের সব টাস্ক কমপ্লিট করেছেন!";
      icon = "fas fa-award";
    }
    
    messageElement.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
    
    // Change color based on progress
    if (percentage >= 75) {
      messageElement.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.2), transparent)";
      messageElement.style.borderLeft = "4px solid #10b981";
    } else if (percentage >= 50) {
      messageElement.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.2), transparent)";
      messageElement.style.borderLeft = "4px solid #f59e0b";
    } else {
      messageElement.style.background = "linear-gradient(135deg, rgba(14, 165, 233, 0.2), transparent)";
      messageElement.style.borderLeft = "4px solid #0ea5e9";
    }
  }
}

// Notes System
let notesSaveTimeout;

function loadNotes() {
  if (!currentUser) return;
  
  const notesKey = `user_${currentUser}_notes`;
  const savedNotes = localStorage.getItem(notesKey);
  
  if (savedNotes) {
    document.getElementById('daily-notes').value = savedNotes;
  }
  
  updateNotesCount();
  
  const notesTextarea = document.getElementById('daily-notes');
  notesTextarea.addEventListener('input', function() {
    updateNotesCount();
    
    if (notesSaveTimeout) {
      clearTimeout(notesSaveTimeout);
    }
    
    notesSaveTimeout = setTimeout(() => {
      saveNotes(true);
    }, 2000);
  });
}

function updateNotesCount() {
  const notesTextarea = document.getElementById('daily-notes');
  const count = notesTextarea.value.length;
  const countElement = document.getElementById('notes-count');
  
  let message = `${count} characters`;
  
  if (count === 0) {
    message = "আপনার চিন্তাভাবনা লিখুন...";
  } else if (count > 500) {
    message = `${count} characters - বিস্তারিত লিখেছেন!`;
  }
  
  countElement.textContent = message;
  
  if (count > 1000) {
    countElement.style.color = "#ef4444";
  } else if (count > 500) {
    countElement.style.color = "#f59e0b";
  } else {
    countElement.style.color = "var(--text-secondary)";
  }
}

function saveNotes(isAutoSave = false) {
  if (!currentUser) return;
  
  const notesTextarea = document.getElementById('daily-notes');
  const notes = notesTextarea.value;
  const notesKey = `user_${currentUser}_notes`;
  
  localStorage.setItem(notesKey, notes);
  
  if (!isAutoSave) {
    showNotificationPopup('নোটস সংরক্ষিত', 'আপনার নোটস সফলভাবে সংরক্ষিত হয়েছে!');
  }
}

// Notification System
let notificationPermission = false;
let notificationInterval = null;
let notificationsOn = false;
const notificationMessages = [
  "আজকের নিয়্যাত পূরণ করো!",
  "কিছু সময় কুরআন তেলাওয়াত করুন।",
  "আজকের দোয়া পড়া হয়েছে?",
  "সুন্নাহ অনুযায়ী কাজ করছো?",
  "পরিবারের সাথে ভালো আচরণ করো।",
  "গীবত/মিথ্যা থেকে বাঁচার চেষ্টা করো।",
  "আজকে কৃতজ্ঞতা প্রকাশ করেছো?",
  "আত্ম-সমীক্ষা করো - আজকের উন্নতির জায়গা কী?",
  "প্রিমিয়াম টাস্কগুলো দেখো একবার!",
  "শেষ ১০ দিনে লাইলাতুল কদর খুঁজো!"
];

function toggleNotifications() {
  if (!('Notification' in window)) {
    alert("আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না");
    return;
  }
  
  if (!notificationPermission) {
    requestNotificationPermission();
  } else {
    notificationsOn = !notificationsOn;
    updateNotificationButton();
    
    if (notificationsOn) {
      startNotificationInterval();
      localStorage.setItem('notifications_enabled', 'true');
      showNotificationPopup("নোটিফিকেশন চালু", "আপনি এখন প্রতি ঘণ্টায় রিমাইন্ডার পাবেন।");
    } else {
      stopNotificationInterval();
      localStorage.setItem('notifications_enabled', 'false');
      showNotificationPopup("নোটিফিকেশন বন্ধ", "আর কোনো রিমাইন্ডার পাঠানো হবে না।");
    }
  }
}

function requestNotificationPermission() {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      notificationPermission = true;
      notificationsOn = true;
      updateNotificationButton();
      startNotificationInterval();
      localStorage.setItem('notifications_enabled', 'true');
      
      showNotification("নোটিফিকেশন চালু", "আপনি এখন রমজান টাস্কের জন্য রিমাইন্ডার পাবেন!");
      showNotificationPopup("অনুমতি প্রদান", "নোটিফিকেশন এখন চালু। আপনি প্রতি ঘণ্টায় রিমাইন্ডার পাবেন।");
    }
  });
}

function updateNotificationButton() {
  const btn = document.getElementById('notify-btn');
  if (notificationsOn) {
    btn.innerHTML = '<i class="fas fa-bell"></i>';
    btn.style.background = "rgba(16, 185, 129, 0.3)";
    btn.title = "নোটিফিকেশন চালু";
  } else {
    btn.innerHTML = '<i class="fas fa-bell-slash"></i>';
    btn.style.background = "rgba(255, 255, 255, 0.2)";
    btn.title = "নোটিফিকেশন বন্ধ";
  }
}

function startNotificationInterval() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  notificationInterval = setInterval(() => {
    if (notificationsOn && document.visibilityState === 'visible') {
      const randomMsg = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
      showNotification("রমজান রিমাইন্ডার 🌙", randomMsg);
    }
  }, 3600000);
  
  setTimeout(() => {
    if (notificationsOn) {
      showNotification("রমজান প্ল্যানার রিমাইন্ডার", "আপনার আজকের টাস্কগুলো চেক করুন!");
    }
  }, 10000);
}

function stopNotificationInterval() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

function showNotification(title, body) {
  if (!notificationPermission || !notificationsOn) return;
  
  const options = {
    body: body,
    icon: 'https://img.icons8.com/color/96/000000/ramadan.png',
    badge: 'https://img.icons8.com/color/96/000000/ramadan.png',
    tag: 'ramadan-reminder',
    renotify: true,
    vibrate: [200, 100, 200]
  };
  
  new Notification(title, options);
}

function showNotificationPopup(title, message) {
  const existingPopup = document.querySelector('.notification-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  const popup = document.createElement('div');
  popup.className = 'notification-popup';
  popup.innerHTML = `
    <h3><i class="fas fa-bell"></i> ${title}</h3>
    <p>${message}</p>
    <button onclick="this.parentElement.remove()">ঠিক আছে</button>
  `;
  
  document.body.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 5000);
}

// Custom Habits System
class Habit {
  constructor(id, name, icon = '📌', color = '#10b981', createdAt = new Date().toISOString()) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.color = color;
    this.createdAt = createdAt;
    this.completedDates = {};
    this.streak = 0;
  }
  
  toggleCompletion(date = getToday()) {
    if (this.completedDates[date]) {
      delete this.completedDates[date];
    } else {
      this.completedDates[date] = true;
    }
    this.updateStreak();
  }
  
  isCompleted(date = getToday()) {
    return !!this.completedDates[date];
  }
  
  updateStreak() {
    const dates = Object.keys(this.completedDates).sort();
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(currentDate);
      if (this.completedDates[dateStr]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    this.streak = streak;
    return streak;
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function loadHabits() {
  if (!currentUser) return [];
  
  const key = `user_${currentUser}_habits`;
  const saved = localStorage.getItem(key);
  
  if (saved) {
    try {
      const habitsData = JSON.parse(saved);
      return habitsData.map(h => {
        const habit = new Habit(h.id, h.name, h.icon, h.color, h.createdAt);
        habit.completedDates = h.completedDates || {};
        habit.streak = h.streak || 0;
        return habit;
      });
    } catch (e) {
      console.error('Error loading habits:', e);
      return [];
    }
  }
  
  return [];
}

function saveHabits(habits) {
  if (!currentUser) return;
  
  const key = `user_${currentUser}_habits`;
  localStorage.setItem(key, JSON.stringify(habits));
}

function renderHabits() {
  const habits = loadHabits();
  const container = document.getElementById('custom-habit-list');
  
  if (!container) return;
  
  if (habits.length === 0) {
    container.innerHTML = `
      <div class="empty-habits">
        <p>কোনো কাস্টম অভ্যাস এখনো যোগ করা হয়নি!</p>
        <p style="font-size:12px; margin-top:5px;">উপরের ফর্ম ব্যবহার করে আপনার প্রথম অভ্যাস যোগ করুন।</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  habits.forEach((habit) => {
    const isCompleted = habit.isCompleted();
    const habitElement = document.createElement('div');
    habitElement.className = `habit-item ${isCompleted ? 'habit-completed' : ''}`;
    habitElement.style.borderLeftColor = habit.color;
    
    habitElement.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" ${isCompleted ? 'checked' : ''} 
               onchange="toggleCustomHabit('${habit.id}')">
        <span class="checkmark"></span>
      </label>
      <span class="habit-text">${habit.name}</span>
      <span class="habit-icon">${habit.icon}</span>
      <button onclick="deleteCustomHabit('${habit.id}')" class="btn-small" style="margin-left:5px; padding:2px 6px;">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    container.appendChild(habitElement);
  });
}

function toggleHabitsSection() {
  const form = document.getElementById('add-habit-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addNewHabit() {
  const nameInput = document.getElementById('new-habit-name');
  const colorInput = document.getElementById('new-habit-color');
  const iconSelect = document.getElementById('new-habit-icon');
  
  const name = nameInput.value.trim();
  const color = colorInput.value;
  const icon = iconSelect.value;
  
  if (!name) {
    showNotificationPopup('ত্রুটি', 'অভ্যাসের নাম লিখুন!');
    nameInput.focus();
    return;
  }
  
  const habits = loadHabits();
  const habitId = 'habit-' + Date.now();
  const newHabit = new Habit(habitId, name, icon, color);
  
  habits.push(newHabit);
  saveHabits(habits);
  renderHabits();
  
  nameInput.value = '';
  colorInput.value = '#10b981';
  iconSelect.selectedIndex = 0;
  
  showNotificationPopup('সফল!', `"${name}" অভ্যাস যোগ করা হয়েছে!`);
  updateProgress();
}

function toggleCustomHabit(habitId) {
  const habits = loadHabits();
  const habitIndex = habits.findIndex(h => h.id === habitId);
  
  if (habitIndex !== -1) {
    habits[habitIndex].toggleCompletion();
    saveHabits(habits);
    renderHabits();
    updateProgress();
  }
}

function deleteCustomHabit(habitId) {
  if (!confirm('আপনি কি এই অভ্যাসটি মুছে ফেলতে চান?')) return;
  
  const habits = loadHabits();
  const habitIndex = habits.findIndex(h => h.id === habitId);
  
  if (habitIndex !== -1) {
    habits.splice(habitIndex, 1);
    saveHabits(habits);
    renderHabits();
    showNotificationPopup('মুছে ফেলা হয়েছে!', 'অভ্যাসটি মুছে ফেলা হয়েছে।');
  }
}

// Modal Functions
function toggleQuranSection() {
  const modal = document.getElementById('quran-modal');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = `
    <h2><i class="fas fa-book-quran"></i> কুরআন তিলাওয়াত</h2>
    <div class="quran-content">
      <h3>সূরা আল-ফাতিহা</h3>
      <div class="arabic-text" style="font-family: 'Amiri', serif; font-size: 24px; text-align: right; direction: rtl; line-height: 2; margin: 20px 0;">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾
      </div>
      <div class="translation" style="margin: 20px 0; padding: 15px; background: var(--bg-accent); border-radius: 10px;">
        <h4>অনুবাদ:</h4>
        <p>১. শুরু করছি আল্লাহর নামে যিনি পরম করুণাময়, অতি দয়ালু।<br>
           ২. সমস্ত প্রশংসা আল্লাহর জন্য, যিনি সকল সৃষ্টির প্রতিপালক।<br>
           ৩. যিনি পরম করুণাময়, অতি দয়ালু।<br>
           ৪. যিনি বিচার দিনের মালিক।<br>
           ৫. আমরা তোমারই ইবাদত করি এবং তোমারই কাছে সাহায্য চাই।<br>
           ৬. আমাদেরকে সরল পথ দেখাও।<br>
           ৭. তাদের পথ যাদেরকে তুমি নিয়ামত দান করেছ, তাদের পথ নয় যাদের উপর তোমার গজব নাযিল হয়েছে এবং পথভ্রষ্টদের।</p>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

function toggleHadithSection() {
  const modal = document.getElementById('quran-modal');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = `
    <h2><i class="fas fa-scroll"></i> হাদিস সংগ্রহ</h2>
    <div class="hadith-content">
      <h3>রমজান মাসের ফজিলত</h3>
      <div class="arabic-text" style="font-family: 'Amiri', serif; font-size: 22px; text-align: right; direction: rtl; line-height: 2; margin: 20px 0; padding: 15px; background: var(--bg-accent); border-radius: 10px;">
        مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ
      </div>
      <div class="translation" style="margin: 20px 0; padding: 15px; background: var(--bg-accent); border-radius: 10px;">
        <h4>অনুবাদ:</h4>
        <p>যে ব্যক্তি ঈমান ও সওয়াবের আশায় রমজান মাসের সিয়াম পালন করবে, তার পূর্ববর্তী সব গুনাহ মাফ করে দেওয়া হবে।</p>
        
        <h4 style="margin-top: 15px;">ব্যাখ্যা:</h4>
        <p>এই হাদিস দ্বারা রমজানের সিয়ামের গুরুত্ব ও ফজিলত বর্ণনা করা হয়েছে। সিয়াম শুধু ক্ষুধা-তৃষ্ণা নয়, বরং পূর্ণ ঈমান ও আল্লাহর সন্তুষ্টির জন্য পালন করতে হবে। রমজান মাসে প্রত্যেক নেক আমলের সওয়াব ৭০ গুণ বৃদ্ধি করা হয়।</p>
        
        <div style="margin-top: 15px; padding: 10px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px;">
          <strong>সূত্র:</strong> সহীহ বুখারী, হাদিস: ৩৮
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('quran-modal').style.display = 'none';
}

// Utility Functions
function playSuccessSound() {
  // Simple beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    // Audio not supported
  }
}



// Main JavaScript file এর শেষে এই কোডগুলো যোগ করুন

// Star Background Creation
function createStarBackground() {
  const container = document.createElement('div');
  container.className = 'star-background';
  document.body.appendChild(container);
  
  // Ramadan pattern overlay
  const pattern = document.createElement('div');
  pattern.className = 'ramadan-pattern';
  document.body.appendChild(pattern);
  
  // Moon for dark mode
  const moon = document.createElement('div');
  moon.className = 'moon-animation';
  document.body.appendChild(moon);
  
  const starCount = window.innerWidth < 768 ? 50 : 100;
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 3 + 1;
    
    // Random twinkle duration
    const duration = Math.random() * 5 + 3;
    
    star.style.cssText = `
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      height: ${size}px;
      --duration: ${duration}s;
      animation-delay: ${Math.random() * 5}s;
    `;
    
    container.appendChild(star);
  }
}

// Enhanced checkbox click effect
function enhanceCheckboxEffects() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        // Create completion animation
        const rect = this.getBoundingClientRect();
        const animation = document.createElement('div');
        animation.className = 'completion-animation';
        animation.innerHTML = '<div>✨</div>';
        animation.style.cssText = `
          position: fixed;
          top: ${rect.top + rect.height/2}px;
          left: ${rect.left + rect.width/2}px;
          z-index: 10000;
          pointer-events: none;
        `;
        
        document.body.appendChild(animation);
        
        // Play enhanced sound
        playEnhancedSound();
        
        // Remove animation after it completes
        setTimeout(() => {
          animation.remove();
        }, 2000);
      }
    });
  });
}

// Enhanced sound effect
function playEnhancedSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a richer sound
    const frequencies = [800, 1200, 1600];
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = i === 0 ? 'sine' : 'triangle';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2/(i+1), audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5 + i*0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    });
  } catch (e) {
    // Audio not supported
    console.log("Audio not supported");
  }
}

// Floating Action Button for mobile
function createFloatingButton() {
  if (window.innerWidth <= 768) {
    const fab = document.createElement('button');
    fab.className = 'floating-action-btn';
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.title = "দ্রুত টাস্ক যোগ করুন";
    
    fab.addEventListener('click', function() {
      toggleHabitsSection();
      // Scroll to habits section
      document.querySelector('.habits-card').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    });
    
    document.body.appendChild(fab);
    
    // Hide/show based on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > lastScrollTop) {
        // Scrolling down
        fab.style.transform = 'translateY(100px)';
      } else {
        // Scrolling up
        fab.style.transform = 'translateY(0)';
      }
      lastScrollTop = st <= 0 ? 0 : st;
    }, false);
  }
}

// Ramadan Countdown Timer
function createCountdownTimer() {
  // Set Ramadan end date (example: 30 days from now)
  const ramadanEnd = new Date();
  ramadanEnd.setDate(ramadanEnd.getDate() + 30);
  
  const countdownDiv = document.createElement('div');
  countdownDiv.className = 'countdown-container';
  countdownDiv.innerHTML = `
    <div class="countdown-title">রমজান শেষ হতে বাকি</div>
    <div class="countdown-timer" id="ramadan-countdown">৩০:০০:০০:০০</div>
  `;
  
  document.body.appendChild(countdownDiv);
  
  function updateCountdown() {
    const now = new Date();
    const diff = ramadanEnd - now;
    
    if (diff <= 0) {
      countdownDiv.innerHTML = `
        <div class="countdown-title">রমজান শেষ!</div>
        <div class="countdown-timer">শাওয়াল শুরু</div>
      `;
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('ramadan-countdown').textContent = 
      `${days.toString().padStart(2, '০')}:${hours.toString().padStart(2, '০')}:${minutes.toString().padStart(2, '০')}:${seconds.toString().padStart(2, '০')}`;
  }
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
  
  // Hide on small screens
  if (window.innerWidth <= 768) {
    countdownDiv.style.display = 'none';
  }
}

// Page loading animation
function showLoadingAnimation() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-spinner';
  loadingDiv.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loadingDiv);
  
  // Remove after 1 second
  setTimeout(() => {
    loadingDiv.style.opacity = '0';
    setTimeout(() => {
      loadingDiv.remove();
    }, 300);
  }, 1000);
}

// Initialize all enhanced features
function initializeEnhancedFeatures() {
  createStarBackground();
  enhanceCheckboxEffects();
  createFloatingButton();
  createCountdownTimer();
  showLoadingAnimation();
  
  // Add ripple effect to buttons
  document.querySelectorAll('.btn-primary, .btn-small').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        pointer-events: none;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Update window.onload function
window.onload = () => {
  initTheme();
  
  const savedUser = localStorage.getItem("currentUser");
  if(savedUser){
    currentUser = savedUser;
    showPlanner();
  }
  
  // Set today's date
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = today.toLocaleDateString('bn-BD', options);
  document.getElementById('today-date').textContent = dateStr;
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      logoutUser();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      toggleNotifications();
    }
  });
  
  // Initialize enhanced features
  initializeEnhancedFeatures();
};

// Update progress message with emoji animation
function updateProgressMessageAnimation() {
  const messageElement = document.getElementById('progress-message');
  if (!messageElement) return;
  
  const percentage = parseInt(document.getElementById('progress-percentage').textContent);
  const emojis = ["🌙", "⭐", "🕌", "🤲", "📿", "🕋"];
  
  // Add rotating emoji
  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'progress-emoji';
  emojiSpan.style.cssText = `
    display: inline-block;
    margin-left: 10px;
    animation: rotateEmoji 2s infinite linear;
  `;
  
  // Add emoji rotation animation
  const emojiStyle = document.createElement('style');
  emojiStyle.textContent = `
    @keyframes rotateEmoji {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(emojiStyle);
  
  // Update emoji based on progress
  let emojiIndex = Math.floor(percentage / 20);
  if (emojiIndex >= emojis.length) emojiIndex = emojis.length - 1;
  emojiSpan.textContent = emojis[emojiIndex];
  
  // Remove existing emoji if any
  const existingEmoji = messageElement.querySelector('.progress-emoji');
  if (existingEmoji) {
    existingEmoji.remove();
  }
  
  messageElement.appendChild(emojiSpan);
}

//=============================================================================
// DISTRICT SCHEDULE SYSTEM - সম্পূর্ণ নতুন কোড
//=============================================================================

// জেলার ডাটা - এখানে আপনার PDF/ছবির পাথ দিন
const districtScheduleData = {
  dhaka: {
    name: 'ঢাকা',
    file: {
      type: 'pdf', // 'pdf' অথবা 'jpg'/'png'
      path: 'schedules/dhaka-ramadan-schedule.pdf',
      filename: 'dhaka-ramadan-schedule-2025.pdf'
    }
  },
  chittagong: {
    name: 'চট্টগ্রাম',
    file: {
      type: 'pdf',
      path: 'schedules/chittagong-ramadan-schedule.pdf',
      filename: 'chittagong-ramadan-schedule-2025.pdf'
    }
  },
  sylhet: {
    name: 'সিলেট',
    file: null // এখনো ফাইল নাই
  },
  rajshahi: {
    name: 'রাজশাহী',
    file: null
  },
  khulna: {
    name: 'খুলনা',
    file: null
  },
  barisal: {
    name: 'বরিশাল',
    file: null
  },
  rangpur: {
    name: 'রংপুর',
    file: null
  },
  mymensingh: {
    name: 'ময়মনসিংহ',
    file: null
  },
  comilla: {
    name: 'কুমিল্লা',
    file: null
  },
  narsingdi: {
    name: 'নরসিংদী',
    file: null
  }
};

// সময়সূচী দেখুন ফাংশন
function showDistrictSchedule() {
  // এলিমেন্টগুলো খুঁজি
  const select = document.getElementById('districtSelect');
  const districtSpan = document.getElementById('selected-district');
  const container = document.getElementById('scheduleContainer');
  const footer = document.getElementById('scheduleFooter');
  const btn = event ? event.target : document.querySelector('.view-schedule-btn');
  
  // জেলা চেক করি
  if (!select || !select.value) {
    alert('⚠️ অনুগ্রহ করে একটি জেলা নির্বাচন করুন!');
    return;
  }
  
  const districtCode = select.value;
  const district = districtScheduleData[districtCode];
  
  if (!district) {
    alert('⚠️ জেলার তথ্য পাওয়া যায়নি!');
    return;
  }
  
  // জেলার নাম আপডেট করি
  if (districtSpan) {
    districtSpan.textContent = district.name;
  }
  
  // বাটনে লোডিং দেখাই
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> দেখাচ্ছে...';
  btn.disabled = true;
  
  // একটু delay দিয়ে দেখাই
  setTimeout(() => {
    
    // চেক করি ফাইল আছে কিনা
    if (!district.file) {
      // ফাইল নাই
      container.innerHTML = `
        <div class="coming-soon">
          <i class="fas fa-clock"></i>
          <h3>${district.name} জেলার সময়সূচী</h3>
          <p>আমরা প্রস্তুতি নিচ্ছি...</p>
          <div class="coming-soon-badge">
            <i class="fas fa-hourglass-half"></i> ১-২ দিনের মধ্যে দেওয়া হবে
          </div>
        </div>
      `;
      footer.innerHTML = '';
    } else {
      // ফাইল আছে
      const file = district.file;
      
      if (file.type === 'pdf') {
        container.innerHTML = `
          <iframe src="${file.path}#toolbar=1&navpanes=1&view=FitH" 
                  class="schedule-frame" 
                  title="${district.name} - রমজান সময়সূচী"></iframe>
        `;
      } else {
        container.innerHTML = `
          <img src="${file.path}" 
               alt="${district.name} - রমজান সময়সূচী" 
               class="schedule-image" 
               onclick="openImageModal('${file.path}')"
               style="cursor: pointer;">
        `;
      }
      
      footer.innerHTML = `
        <a href="${file.path}" download="${file.filename}" class="download-btn">
          <i class="fas fa-download"></i> ডাউনলোড করুন
        </a>
      `;
    }
    
    // বাটন আগের অবস্থায় ফিরাই
    btn.innerHTML = originalText;
    btn.disabled = false;
    
  }, 500);
}

// ছবি বড় করে দেখার ফাংশন
function openImageModal(src) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('zoomedImage');
  img.src = src;
  modal.style.display = 'block';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

// পৃষ্ঠা লোড হওয়ার পর চেক করি
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ District schedule system loaded');
  
  // টেস্ট করার জন্য কনসোল লগ
  const select = document.getElementById('districtSelect');
  const btn = document.querySelector('.view-schedule-btn');
  
  if (select) console.log('✅ District select found');
  if (btn) console.log('✅ View button found');
});
// Update prayer times based on selected district
function updatePrayerTimes() {
  const districtSelect = document.getElementById('district-select');
  const selectedDistrict = districtSelect.value;
  
  if (selectedDistrict && prayerTimesData[selectedDistrict]) {
    const times = prayerTimesData[selectedDistrict];
    
    // Update display
    document.getElementById('iftar-time').textContent = times.iftar;
    document.getElementById('sehri-time').textContent = times.sehri_end;
    
    // Update dates
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = today.toLocaleDateString('bn-BD', options);
    
    document.getElementById('iftar-date').textContent = dateStr;
    document.getElementById('sehri-date').textContent = dateStr;
    
    // Start countdown
    startCountdown(times.iftar, times.sehri_end);
    
    // Save selected district to localStorage
    if (currentUser) {
      localStorage.setItem(`user_${currentUser}_district`, selectedDistrict);
    }
    
    // Show success message
    showNotificationPopup('জেলা নির্বাচন', `${times.name} জেলার সময়সূচী আপডেট করা হয়েছে`);
  }
}

// Calculate time remaining
function startCountdown(iftarTime, sehriTime) {
  function updateCountdown() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Iftar countdown
    const iftarDateTime = new Date(`${today}T${iftarTime}:00`);
    if (now > iftarDateTime) {
      // If iftar time has passed, set for tomorrow
      iftarDateTime.setDate(iftarDateTime.getDate() + 1);
    }
    
    const iftarDiff = iftarDateTime - now;
    const iftarHours = Math.floor(iftarDiff / (1000 * 60 * 60));
    const iftarMinutes = Math.floor((iftarDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('iftar-countdown').innerHTML = `
      <i class="fas fa-hourglass-half"></i>
      <span>${iftarHours}ঘ ${iftarMinutes}মি</span>
    `;
    
    // Sehri countdown
    const sehriDateTime = new Date(`${today}T${sehriTime}:00`);
    if (now > sehriDateTime) {
      // If sehri time has passed, set for tomorrow
      sehriDateTime.setDate(sehriDateTime.getDate() + 1);
    }
    
    const sehriDiff = sehriDateTime - now;
    const sehriHours = Math.floor(sehriDiff / (1000 * 60 * 60));
    const sehriMinutes = Math.floor((sehriDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('sehri-countdown').innerHTML = `
      <i class="fas fa-hourglass-half"></i>
      <span>${sehriHours}ঘ ${sehriMinutes}মি</span>
    `;
    
    // Update current time
    updateCurrentTime();
  }
  
  updateCountdown();
  setInterval(updateCountdown, 60000); // Update every minute
}

// Update current time and Hijri date
function updateCurrentTime() {
  const now = new Date();
  
  // Current time
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
  
  // Hijri date (approximation)
  const hijriYear = 1445; // Current Islamic year (approximate)
  const hijriMonth = hijriMonths[8]; // Ramadan (9th month)
  const hijriDay = Math.floor(Math.random() * 29) + 1; // Random day for demo
  
  document.getElementById('hijri-date').textContent = 
    `${hijriDay} ${hijriMonth} ${hijriYear} হিজরি`;
}

// Enhanced Quran Reading Modal
function toggleQuranSection() {
  const modal = document.getElementById('quran-modal');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = `
    <div class="quran-modal-content">
      <h2><i class="fas fa-book-quran"></i> সূরা আল-ফাতিহা পড়ুন</h2>
      
      <div class="quran-reading-options">
        <button class="quran-option-btn active" onclick="showArabicText()">
          <i class="fas fa-font"></i> আরবি পাঠ
        </button>
        <button class="quran-option-btn" onclick="showTransliteration()">
          <i class="fas fa-language"></i> উচ্চারণ
        </button>
        <button class="quran-option-btn" onclick="showTranslation()">
          <i class="fas fa-book"></i> বাংলা অনুবাদ
        </button>
        <button class="quran-option-btn" onclick="showTafsir()">
          <i class="fas fa-graduation-cap"></i> তাফসির
        </button>
      </div>
      
      <div class="audio-controls">
        <div class="audio-player">
          <select class="reciter-select" onchange="playQuranRecitation(this.value)">
            <option value="">ক্বারি নির্বাচন করুন</option>
            <option value="hussary">মিশরী আল-হুসারী</option>
            <option value="sudais">আব্দুর রহমান আস-সুদাইস</option>
            <option value="shuraim">সা'দ আল-গামিদী</option>
          </select>
        </div>
        <button class="play-btn" onclick="playAudio()">
          <i class="fas fa-play"></i> তেলাওয়াত শুনুন
        </button>
      </div>
      
      <div id="quran-content">
        <!-- Content will be loaded here -->
      </div>
      
      <div class="reading-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">পড়া হয়েছে: <span>0%</span></div>
      </div>
    </div>
  `;
  
  // Show Arabic text by default
  showArabicText();
  modal.style.display = 'block';
}

// Show Arabic text
function showArabicText() {
  const contentDiv = document.getElementById('quran-content');
  contentDiv.innerHTML = `
    <div class="arabic-text-large">
      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ 
      الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ 
      الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ 
      مَالِكِ يَوْمِ الدِّينِ ﴿ٴ﴾ 
      إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ 
      اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ 
      صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾
    </div>
    
    <div class="reading-tips">
      <h3><i class="fas fa-lightbulb"></i> পড়ার টিপস:</h3>
      <ul>
        <li>উচ্চারণ সঠিকভাবে করুন</li>
        <li>আয়াতের অর্থ চিন্তা করুন</li>
        <li>ধীরে ধীরে পড়ুন</li>
        <li>নিয়ত করুন আল্লাহর সন্তুষ্টির জন্য</li>
      </ul>
    </div>
  `;
  
  updateActiveButton('আরবি পাঠ');
}

// Show transliteration
function showTransliteration() {
  const contentDiv = document.getElementById('quran-content');
  contentDiv.innerHTML = `
    <div class="transliteration-section">
      <h4><i class="fas fa-language"></i> সূরা ফাতিহা - উচ্চারণ:</h4>
      
      <div class="transliteration-text">
        <p><strong>আয়াত ১:</strong> বিসমিল্লাহির রাহমানির রাহীম</p>
        <p><strong>আয়াত ২:</strong> আল-হামদু লিল্লাহি রাব্বিল আলামীন</p>
        <p><strong>আয়াত ৩:</strong> আর-রাহমানির রাহীম</p>
        <p><strong>আয়াত ৪:</strong> মালিকি ইয়াউমিদ্দীন</p>
        <p><strong>আয়াত ৫:</strong> ইয়্যাকা না'বুদু ওয়া ইয়্যাকা নাসতাঈন</p>
        <p><strong>আয়াত ৬:</strong> ইহদিনাস সিরাতাল মুস্তাকীম</p>
        <p><strong>আয়াত ৭:</strong> সিরাতাল্লাযিনা আনআমতা আলাইহিম, গাইরিল মাগদুবে আলাইহিম ওয়ালাদ দোয়াল্লীন</p>
      </div>
      
      <div class="pronunciation-guide">
        <h4><i class="fas fa-volume-up"></i> উচ্চারণ গাইড:</h4>
        <ul>
          <li>◌ّ (শদ্দাহ) - হরফকে দ্বিত্ব উচ্চারণ করুন</li>
          <li>◌َ (ফাতহাহ) - "আ" উচ্চারণ</li>
          <li>◌ِ (কসরাহ) - "ই" উচ্চারণ</li>
          <li>◌ُ (দম্মাহ) - "উ" উচ্চারণ</li>
          <li>ء (হামযাহ) - গলার স্বর</li>
        </ul>
      </div>
    </div>
  `;
  
  updateActiveButton('উচ্চারণ');
}

// Show translation
function showTranslation() {
  const contentDiv = document.getElementById('quran-content');
  contentDiv.innerHTML = `
    <div class="translation-section">
      <h4><i class="fas fa-book"></i> সূরা ফাতিহা - বাংলা অনুবাদ:</h4>
      
      <div class="translation-text">
        <div class="ayat-translation">
          <h5>আয়াত ১:</h5>
          <p>পরম করুণাময়, অতি দয়ালু আল্লাহর নামে শুরু করছি।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ২:</h5>
          <p>সমস্ত প্রশংসা আল্লাহর জন্য, যিনি বিশ্বজগতের পালনকর্তা।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ৩:</h5>
          <p>যিনি পরম করুণাময়, অতি দয়ালু।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ৪:</h5>
          <p>যিনি বিচার দিনের মালিক।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ৫:</h5>
          <p>আমরা একমাত্র তোমারই ইবাদাত করি এবং একমাত্র তোমারই নিকট সাহায্য চাই।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ৬:</h5>
          <p>আমাদেরকে সরল পথ দেখাও।</p>
        </div>
        
        <div class="ayat-translation">
          <h5>আয়াত ৭:</h5>
          <p>সেসব লোকের পথ, যাদেরকে তুমি নেয়ামত দান করেছ; যাদের প্রতি তোমার গযব নাযিল হয়নি এবং যারা পথভ্রষ্ট নয়।</p>
        </div>
      </div>
    </div>
  `;
  
  updateActiveButton('বাংলা অনুবাদ');
}

// Show tafsir
function showTafsir() {
  const contentDiv = document.getElementById('quran-content');
  contentDiv.innerHTML = `
    <div class="tafsir-section">
      <h4><i class="fas fa-graduation-cap"></i> সূরা ফাতিহা - সংক্ষিপ্ত তাফসির:</h4>
      
      <div class="tafsir-content">
        <div class="tafsir-point">
          <h5>সূরা ফাতিহার বিশেষত্ব:</h5>
          <p>সূরা ফাতিহা কুরআনের সর্বপ্রথম সূরা এবং এটিকে "উম্মুল কিতাব" বা কিতাবের মাতা বলা হয়। এই সূরাকে নামাজের অপরিহার্য অংশ হিসেবে পড়তে হয়।</p>
        </div>
        
        <div class="tafsir-point">
          <h5>প্রধান শিক্ষা:</h5>
          <ul>
            <li>একত্ববাদ - শুধুমাত্র আল্লাহর ইবাদাত</li>
            <li>সরল পথের প্রার্থনা - সিরাতুল মুস্তাকীম</li>
            <li>আল্লাহর গুণাবলী - রহমান, রহীম, রব</li>
            <li>বিচার দিবসের প্রতি বিশ্বাস</li>
          </ul>
        </div>
        
        <div class="tafsir-point">
          <h5>রমজানের সাথে সম্পর্ক:</h5>
          <p>রমজান মাসে কুরআন নাযিল শুরু হয়েছিল। সূরা ফাতিহা কুরআনের সারসংক্ষেপ হিসেবে কাজ করে। রমজানে এই সূরার অর্থ ও তাফসির নিয়ে চিন্তা করা বিশেষ সওয়াবের কাজ।</p>
        </div>
      </div>
    </div>
  `;
  
  updateActiveButton('তাফসির');
}

// Update active button in Quran modal
function updateActiveButton(buttonText) {
  const buttons = document.querySelectorAll('.quran-option-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(buttonText)) {
      btn.classList.add('active');
    }
  });
}

// Play Quran recitation (demo function)
function playQuranRecitation(reciter) {
  if (reciter) {
    showNotificationPopup('তেলাওয়াত শুরু', `${reciter} এর কন্ঠে সূরা ফাতিহা শুনতে পাবেন (ডেমো)`);
    
    // Simulate audio play
    const playBtn = document.querySelector('.play-btn');
    playBtn.innerHTML = '<i class="fas fa-pause"></i> তেলাওয়াত চলছে...';
    playBtn.onclick = function() {
      showNotificationPopup('তেলাওয়াত বন্ধ', 'তেলাওয়াত বন্ধ করা হয়েছে');
      playBtn.innerHTML = '<i class="fas fa-play"></i> তেলাওয়াত শুনুন';
      playBtn.onclick = playAudio;
    };
  }
}

function playAudio() {
  showNotificationPopup('অডিও প্লেয়ার', 'বাস্তব প্রয়োগে এখানে কুরআনের অডিও যুক্ত করা হবে');
}

// Load saved district preference
function loadSavedDistrict() {
  if (currentUser) {
    const savedDistrict = localStorage.getItem(`user_${currentUser}_district`);
    if (savedDistrict && prayerTimesData[savedDistrict]) {
      document.getElementById('district-select').value = savedDistrict;
      updatePrayerTimes();
    }
  }
}

// Update showPlanner function to load district
const originalShowPlanner = showPlanner;
showPlanner = function() {
  originalShowPlanner();
  loadSavedDistrict();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000); // Update time every second
};

// Update window.onload to include Ramadan day calculation
window.onload = () => {
  initTheme();
  
  const savedUser = localStorage.getItem("currentUser");
  if(savedUser){
    currentUser = savedUser;
    showPlanner();
  }
  
  // Set today's date
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = today.toLocaleDateString('bn-BD', options);
  document.getElementById('today-date').textContent = dateStr;
  
  // Calculate Ramadan day (assuming Ramadan starts on March 10, 2025)
  const ramadanStart = new Date('2025-03-10');
  const diffTime = Math.abs(today - ramadanStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays > 0 && diffDays <= 30) {
    document.getElementById('ramadan-day').textContent = `দিন ${diffDays}`;
    
    // Update special day text based on Ramadan day
    const specialDayText = document.querySelector('.special-card .task-text');
    if (diffDays <= 10) {
      specialDayText.textContent = `আজ রমজানের ${diffDays}ম দিন। প্রথম ১০ দিনে রহমতের মৌসুম।`;
    } else if (diffDays <= 20) {
      specialDayText.textContent = `আজ রমজানের ${diffDays}ম দিন। মাগফিরাতের ১০ দিন চলছে।`;
    } else {
      specialDayText.textContent = `আজ রমজানের ${diffDays}ম দিন। শেষ ১০ দিনে লাইলাতুল কদর খুঁজুন।`;
    }
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      logoutUser();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      toggleNotifications();
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      document.getElementById('district-select').focus();
    }
  });
  
  // Initialize enhanced features
  initializeEnhancedFeatures();
};
// Update the updateProgress function to include animation
const originalUpdateProgress = updateProgress;
updateProgress = function() {
  originalUpdateProgress();
  updateProgressMessageAnimation();
};
// Initialize notification permission check
window.addEventListener('load', () => {
  if ('Notification' in window) {
    notificationPermission = Notification.permission === 'granted';
    
    const savedNotify = localStorage.getItem('notifications_enabled');
    if (savedNotify === 'true') {
      notificationsOn = true;
      updateNotificationButton();
      startNotificationInterval();
    }
  }
});


