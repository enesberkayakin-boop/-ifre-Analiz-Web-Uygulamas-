// HTML içindeki etkileşimli elementleri JavaScript değişkenlerine atıyoruz
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const copyPasswordBtn = document.getElementById('copyPassword');
const eyeIcon = document.getElementById('eyeIcon');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const crackTimeElement = document.getElementById('crackTime');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const suggestionsList = document.getElementById('suggestionsList');
const toast = document.getElementById('toast');

// İhlal kontrolü için elementler
const checkBreachBtn = document.getElementById('checkBreachBtn');
const breachResult = document.getElementById('breachResult');

// 4 adet kriter metodunun durumlarını yöneteceğimiz elementler
const criteriaElements = {
    length: document.getElementById('lengthCriteria'),
    case: document.getElementById('caseCriteria'),
    number: document.getElementById('numberCriteria'),
    special: document.getElementById('specialCriteria')
};

/**
 * Şifre denetimi için Düzenli İfadeler (Regex)
 * regex.length: En az 12 herhangi bir karakter
 * regex.case: En az 1 küçük ve 1 büyük harf (Türkçe karakterleri de kapsar)
 * regex.number: En az 1 rakam içeriyor mu denetimi
 * regex.special: Belirtilen alfanümerik ve boşluk dışındaki özel karakterlerden en az bir tane barındırma denetimi
 */
const regex = {
    length: /.{12,}/,
    case: /(?=.*[a-zçğıöşü])(?=.*[A-ZÇĞİÖŞÜ])/,
    number: /[0-9]/,
    special: /[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s]/
};

// Şifre gösterme/gizleme işlevi
togglePassword.addEventListener('click', () => {
    // Mevcut input tipini kontrol et ve tersine çevir
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
// Göz ikonunu değiştir
    if (isPassword) {
        // Gözü çizikli (Gizle) ikon SVG'si
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        // Normal (Göster) ikon SVG'si
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
});

// Toast mesajını gösteren fonksiyon
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    // 2.5 saniye sonra gizle
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Panoya kopyalama yapan asenkron fonksiyon
async function copyToClipboard(text) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showToast('Kopyalandı! ✔');
    } catch (err) {
        console.error('Panoya kopyalanamadı:', err);
    }
}

// Ana kopyalama butonuna tıklanınca inputtaki değeri kopyala
copyPasswordBtn.addEventListener('click', () => {
    copyToClipboard(passwordInput.value);
});

// Şifre alanına boşluk girilmesini (boşluk tuşuna basılmasını) engelle
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
    }
});

// Şifre alanına her tuş basıldığında anlık olarak bu tetiklenir
passwordInput.addEventListener('input', (e) => {
    // Eğer kopyala-yapıştır ile boşluk gelirse, boşlukları temizle
    if (e.target.value.includes(' ')) {
        e.target.value = e.target.value.replace(/\s/g, '');
    }

    const password = e.target.value;
    
    // Alan boşaltılırsa UI'ı (Arayüzü) sıfırla
    if (password === '') {
        resetUI();
        return;
    }
    
    // Değilse analizi başlat
    analyzePassword(password);
});

// Arayüzü başlangıç durumuna döndüren fonksiyon
function resetUI() {
    strengthBar.style.width = '0%';
    strengthBar.style.backgroundColor = 'transparent';
    strengthText.textContent = 'Şifre bekleniyor...';
    strengthText.style.color = 'var(--text-secondary)';
    
    if (crackTimeElement) {
        crackTimeElement.textContent = 'Tahmini Kırılma Süresi: Bekleniyor';
    }
    
    // Kriter elementlerini döngüye alıp sıfırla
    Object.values(criteriaElements).forEach(el => {
        setCriterionMet(el, false);
    });

    // Önerileri gizle ve temizle
    suggestionsContainer.style.display = 'none';
    suggestionsList.innerHTML = '';

    // İhlal kontrol sonucunu gizle
    if (breachResult) {
        breachResult.style.display = 'none';
        breachResult.className = 'breach-result';
    }
}

// Girilen şifreyi analiz eden ana fonksiyon
function analyzePassword(password) {
    let metCriteriaCount = 0; // Kaç kriter sağlandı sayacı
    
    // 1. Kriter: En az 12 karakter
    if (regex.length.test(password)) {
        setCriterionMet(criteriaElements.length, true);
        metCriteriaCount++;
    } else {
        setCriterionMet(criteriaElements.length, false);
    }
    
    // 2. Kriter: En az bir Büyük ve bir Küçük harf
    if (regex.case.test(password)) {
        setCriterionMet(criteriaElements.case, true);
        metCriteriaCount++;
    } else {
        setCriterionMet(criteriaElements.case, false);
    }
    
    // 3. Kriter: En az bir rakam
    if (regex.number.test(password)) {
        setCriterionMet(criteriaElements.number, true);
        metCriteriaCount++;
    } else {
        setCriterionMet(criteriaElements.number, false);
    }
    
    // 4. Kriter: Özel karakter
    if (regex.special.test(password)) {
        setCriterionMet(criteriaElements.special, true);
        metCriteriaCount++;
    } else {
        setCriterionMet(criteriaElements.special, false);
    }
    
    // Sayaca göre ilerleme barını ve skoru güncelle
    updateStrengthMeter(metCriteriaCount);

    // Brute-force kırılma süresini hesapla ve ekranda göster
    calculateCrackTime(password);

    // Güçlü şifre önerilerini oluştur ve ekrana çiz
    const alternatives = generateStrongAlternatives(password);
    renderSuggestions(alternatives);
}

// DOM üzerindeki kriter elementinin yeşil tik veya kırmızı çarpı durumunu belirler
function setCriterionMet(element, isMet) {
    const icon = element.querySelector('.icon');
    if (isMet) {
        element.classList.add('met'); // style.css te yeşil yapan class'ı ekle
        icon.textContent = '✔';       // İkonu onay işareti yap
    } else {
        element.classList.remove('met'); // yeşil class'ı çıkar (kırmızıya döner)
        icon.textContent = '✖';         // İkonu çarpı yap
    }
}

// Kazanılan puana göre çubuğun genişliği ve rengini güncelleyen fonksiyon
function updateStrengthMeter(score) {
    let width = '0%';
    let color = '';
    let text = '';
    
    // Sizin belirttiğiniz puanlama sistemi
    switch (score) {
        case 0:
            width = '15%'; // Bar tamamen kaybolmasın, çok zayıf olduğu belli olsun
            color = 'var(--color-very-weak)';
            text = 'Çok Zayıf 🙁';
            break;
        case 1:
            width = '30%';
            color = 'var(--color-weak)';
            text = 'Zayıf 😕';
            break;
        case 2:
            width = '55%';
            color = 'var(--color-medium)';
            text = 'Orta 😐';
            break;
        case 3:
            width = '80%';
            color = 'var(--color-strong)';
            text = 'Güçlü 🙂';
            break;
        case 4:
            width = '100%';
            color = 'var(--color-excellent)';
            text = 'Mükemmel 😎';
            break;
    }
    
    // Belirlenen değerleri HTML elementinin CSS özellikleri olarak uygula
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

// Girilen parolayı baz alarak rastgele güçlü parola varyasyonları oluşturan fonksiyon
function generateStrongAlternatives(baseText) {
    const specialChars = "!@#$%^&*+?";
    const numbers = "0123456789";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    const alternatives = [];
    
    for (let i = 0; i < 3; i++) {
        // 1. Orijinal metnin harflerini rastgele büyük/küçük yap
        let mixedBase = "";
        let hasUpper = false;
        let hasLower = false;
        
        for (let char of baseText) {
            if (/[a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(char)) {
                if (Math.random() > 0.5) {
                    mixedBase += char.toUpperCase();
                    hasUpper = true;
                } else {
                    mixedBase += char.toLowerCase();
                    hasLower = true;
                }
            } else {
                mixedBase += char;
            }
        }
        
        // 2. Zorunlu parçaları hazırla
        let extension = "";
        
        // Eğer taban metinde büyük veya küçük harf yoksa, eksikleri zorla ekle
        if (!hasUpper) extension += uppers[Math.floor(Math.random() * uppers.length)];
        if (!hasLower) extension += lowers[Math.floor(Math.random() * lowers.length)];
        
        // Rastgele 2 rakam ve 2 özel karakter ekle
        extension += numbers[Math.floor(Math.random() * numbers.length)];
        extension += numbers[Math.floor(Math.random() * numbers.length)];
        extension += specialChars[Math.floor(Math.random() * specialChars.length)];
        extension += specialChars[Math.floor(Math.random() * specialChars.length)];
        
        // Metinleri birleştir
        let newPassword = mixedBase + extension;
        
        // 3. Uzunluk 12 karakterden kısaysa rakamlarla doldur
        while (newPassword.length < 12) {
            newPassword += numbers[Math.floor(Math.random() * numbers.length)];
        }
        
        alternatives.push(newPassword);
    }
    
    return alternatives;
}

// Önerileri HTML içerisine yerleştiren fonksiyon
function renderSuggestions(alternatives) {
    suggestionsList.innerHTML = ''; // Önceki önerileri temizle
    
    alternatives.forEach(alt => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = alt;
        btn.title = "Kopyalamak için tıklayın";
        
        // Butona tıklandığında içindeki şifreyi kopyala
        btn.addEventListener('click', () => {
            copyToClipboard(alt);
        });
        
        suggestionsList.appendChild(btn);
    });
    
    // Öneri kutusunu görünür yap
    suggestionsContainer.style.display = 'block';
}

// Brute-force kırılma süresini hesaplayan matematiksel model
function calculateCrackTime(password) {
    if (!crackTimeElement) return;
    
    // N: Karakter seti büyüklüğü
    let N = 0;
    if (/[a-zçğıöşü]/.test(password)) N += 29;
    if (/[A-ZÇĞİÖŞÜ]/.test(password)) N += 29;
    if (/[0-9]/.test(password)) N += 10;
    
    // Özel karakter seti
    if (/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s]/.test(password)) N += 32;
    
    // Eğer şifre içinde sadece boşluk vb. varsa N'i 1 al (0'dan bölme hatasını engellemek için)
    if (N === 0) N = 1;
    
    // L: Şifre uzunluğu
    const L = password.length;
    
    // GPU brute force hızı: Saniyede 20 milyar deneme -> 2 * 10^10
    const keysPerSecond = 20_000_000_000;
    
    // Matematiksel model: (N^L) / (2 * 10^10)
    // Limiti aşmamak için logaritma kullanalım
    const log10Combinations = L * Math.log10(N);
    const log10Seconds = log10Combinations - Math.log10(keysPerSecond);
    
    let timeText = "";
    
    // Güvenli büyük sayı kontrolü
    if (log10Seconds > 12) { 
        // 10^12 saniye > 31.000 yıl yapar
        timeText = "100+ yıl";
    } else {
        const seconds = Math.pow(10, log10Seconds);
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;
        const years = days / 365;
        
        if (years > 100) {
            timeText = "100+ yıl";
        } else if (years >= 1) {
            timeText = isNaN(years) ? "100+ yıl" : Math.floor(years) + " yıl";
        } else if (days >= 1) {
            timeText = Math.floor(days) + " gün";
        } else if (hours >= 1) {
            timeText = Math.floor(hours) + " saat";
        } else if (minutes >= 1) {
            timeText = Math.floor(minutes) + " dakika";
        } else {
            if (seconds < 1) {
                timeText = "<1 saniye";
            } else {
                timeText = Math.floor(seconds) + " saniye";
            }
        }
    }
    
    crackTimeElement.textContent = "Tahmini Kırılma Süresi: " + timeText;
}

// --- VERİ İHLALİ KONTROLÜ İŞLEMLERİ ---

if (checkBreachBtn) {
    checkBreachBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        if (!password) {
            showToast('Lütfen test etmek için bir şifre girin!');
            return;
        }

        // Yükleniyor durumu
        checkBreachBtn.textContent = 'Kontrol ediliyor...';
        checkBreachBtn.disabled = true;
        breachResult.style.display = 'none';
        breachResult.className = 'breach-result';

        try {
            const isBreached = await checkPasswordBreach(password);

            if (isBreached) {
                breachResult.innerHTML = '<span>❗</span> Bu Şifre Veri İhlalinde Göründü!';
                breachResult.classList.add('danger');
            } else {
                breachResult.innerHTML = '<span>✔</span> Bu Şifre Herhangi Bir Veri İhlalinde Bulunamadı';
                breachResult.classList.add('safe');
            }
            breachResult.style.display = 'flex';
        } catch (error) {
            showToast('Kontrol sırasında bir hata oluştu');
            console.error('İhlal kontrolü hatası:', error);
        } finally {
            checkBreachBtn.textContent = 'Şifreni Kontrol Et';
            checkBreachBtn.disabled = false;
        }
    });
}

/**
 * Şifreyi SHA-1 algoritması ile hashleyip k-Anonymity modeline uygun 
 * olarak Have I Been Pwned API'sine gönderir. Tüm hash ağına gitmez.
 * Sadece hash'in ilk 5 karakterini gönderir. Güvenli bir kontroldür.
 */
async function checkPasswordBreach(password) {
    // Şifreyi SHA-1 ile hashle
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Hex string'e çevirip harfleri büyüt
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.substring(0, 5); // Gönderilecek ilk 5 karakter
    const suffix = hashHex.substring(5);    // Cevaplarda aranacak son kısım
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
        throw new Error('API Hatası: ' + response.status);
    }
    
    // API cevabı satır satır gelir: HASH_SUFFIX:COUNT
    const text = await response.text();
    const lines = text.split('\n');
    
    for (let line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix && hashSuffix.trim() === suffix) {
            return true; // Şifre sızıntıda bulundu
        }
    }
    
    return false; // Şifre temiz
}

