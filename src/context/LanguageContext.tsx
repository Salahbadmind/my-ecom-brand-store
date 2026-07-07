import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ar";

export interface MiniState {
  en: string;
  ar: string;
}

export interface Wilaya {
  code: number;
  en: string;
  ar: string;
  doorPrice: number;
  deskPrice: number;
  miniStates: MiniState[];
}

export const ALGERIAN_WILAYAS: Wilaya[] = [
  {
    code: 1, en: "Adrar", ar: "أدرار", doorPrice: 1400, deskPrice: 650,
    miniStates: [
      { en: "Adrar Center", ar: "أدرار وسط" },
      { en: "Reggane", ar: "رقان" },
      { en: "Aoulef", ar: "أولف" },
      { en: "Tsabit", ar: "تسابيت" },
      { en: "Timiaouine", ar: "تيمياوين" }
    ]
  },
  {
    code: 2, en: "Chlef", ar: "الشلف", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "Chlef Center", ar: "الشلف وسط" },
      { en: "Oued Fodda", ar: "وادي الفضة" },
      { en: "Boukadir", ar: "بوقادير" },
      { en: "Ténès", ar: "تنس" },
      { en: "Ouled Fares", ar: "أولاد فارس" }
    ]
  },
  {
    code: 3, en: "Laghouat", ar: "الأغواط", doorPrice: 900, deskPrice: 450,
    miniStates: [
      { en: "Laghouat Center", ar: "الأغواط وسط" },
      { en: "Aflou", ar: "أفلو" },
      { en: "Hassi R'Mel", ar: "حاسي الرمل" },
      { en: "Ain Madhi", ar: "عين ماضي" },
      { en: "Ksar El Hirane", ar: "قصر الحيران" }
    ]
  },
  {
    code: 4, en: "Oum El Bouaghi", ar: "أم البواقي", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Oum El Bouaghi Center", ar: "أم البواقي وسط" },
      { en: "Aïn Beïda", ar: "عين البيضاء" },
      { en: "Aïn M'lila", ar: "عين مليلة" },
      { en: "Ain Fakroun", ar: "عين الفكرون" },
      { en: "Souk Naamane", ar: "سوق نعمان" }
    ]
  },
  {
    code: 5, en: "Batna", ar: "باتنة", doorPrice: 450, deskPrice: 300,
    miniStates: [
      { en: "Batna Center", ar: "باتنة وسط" },
      { en: "Barika", ar: "بريكة" },
      { en: "N'Gaous", ar: "نقاوس" },
      { en: "Arris", ar: "أريس" },
      { en: "Tazoult", ar: "تازولت" },
      { en: "Merouana", ar: "مروانة" }
    ]
  },
  {
    code: 6, en: "Béjaïa", ar: "بجاية", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Béjaïa Center", ar: "بجاية وسط" },
      { en: "Akbou", ar: "أقبو" },
      { en: "Amizour", ar: "أميزور" },
      { en: "Kherrata", ar: "خراطة" },
      { en: "Sidi Aïch", ar: "سيدي عيش" },
      { en: "Souk El Ténine", ar: "سوق الإثنين" }
    ]
  },
  {
    code: 7, en: "Biskra", ar: "بسكرة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Biskra Center", ar: "بسكرة وسط" },
      { en: "Tolga", ar: "طولقة" },
      { en: "Sidi Okba", ar: "سيدي عقبة" },
      { en: "El Outaya", ar: "الوطاية" },
      { en: "Zeribet El Oued", ar: "زريبة الوادي" }
    ]
  },
  {
    code: 8, en: "Béchar", ar: "بشار", doorPrice: 900, deskPrice: 450,
    miniStates: [
      { en: "Béchar Center", ar: "بشار وسط" },
      { en: "Kenadsa", ar: "قنادسة" },
      { en: "Abadla", ar: "العبادلة" },
      { en: "Taghit", ar: "تاغيت" },
      { en: "Lahmar", ar: "لحمر" }
    ]
  },
  {
    code: 9, en: "Blida", ar: "البليدة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Blida Center", ar: "البليدة وسط" },
      { en: "Boufarik", ar: "بوفاريك" },
      { en: "Larbaa", ar: "الأربعاء" },
      { en: "Ouled Yaïch", ar: "أولاد يعيش" },
      { en: "Mouzaia", ar: "موزاية" },
      { en: "El Affroun", ar: "العفرون" }
    ]
  },
  {
    code: 10, en: "Bouira", ar: "البويرة", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "Bouira Center", ar: "البويرة وسط" },
      { en: "Lakhdaria", ar: "الأخضرية" },
      { en: "Sour El Ghozlane", ar: "سور الغزلان" },
      { en: "Ain Bessem", ar: "عين بسام" },
      { en: "M'Chedallah", ar: "مشد الله" }
    ]
  },
  {
    code: 11, en: "Tamanrasset", ar: "تمنراست", doorPrice: 1600, deskPrice: 700,
    miniStates: [
      { en: "Tamanrasset Center", ar: "تمنراست وسط" },
      { en: "Abalessa", ar: "أبلسة" },
      { en: "Tazrouk", ar: "تاظروك" },
      { en: "Idles", ar: "إدلس" }
    ]
  },
  {
    code: 12, en: "Tébessa", ar: "تبسة", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "Tébessa Center", ar: "تبسة وسط" },
      { en: "Bir El Ater", ar: "بئر العاتر" },
      { en: "Chéria", ar: "الشريعة" },
      { en: "Ouenza", ar: "الونزة" },
      { en: "Negrine", ar: "نقرين" }
    ]
  },
  {
    code: 13, en: "Tlemcen", ar: "تلمسان", doorPrice: 850, deskPrice: 450,
    miniStates: [
      { en: "Tlemcen Center", ar: "تلمسان وسط" },
      { en: "Maghnia", ar: "مغنية" },
      { en: "Ghazaouet", ar: "الغزوات" },
      { en: "Sebdou", ar: "سبدو" },
      { en: "Remchi", ar: "رمشي" },
      { en: "Hennaya", ar: "الحناية" }
    ]
  },
  {
    code: 14, en: "Tiaret", ar: "تيارت", doorPrice: 850, deskPrice: 450,
    miniStates: [
      { en: "Tiaret Center", ar: "تيارت وسط" },
      { en: "Sougueur", ar: "السوقر" },
      { en: "Frenda", ar: "فرندة" },
      { en: "Ksar Chellala", ar: "قصر الشلالة" },
      { en: "Rahouia", ar: "رحوية" }
    ]
  },
  {
    code: 15, en: "Tizi Ouzou", ar: "تيزي وزو", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Tizi Ouzou Center", ar: "تيزي وزو وسط" },
      { en: "Azazga", ar: "عزازقة" },
      { en: "Larbâa Nath Irathen", ar: "الأربعاء ناث إيراثن" },
      { en: "Draâ El Mizan", ar: "ذراع الميزان" },
      { en: "Tigzirt", ar: "تيقزيرت" },
      { en: "Azeffoun", ar: "أزفون" }
    ]
  },
  {
    code: 16, en: "Algiers", ar: "الجزائر", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Algiers Center", ar: "الجزائر الوسطى" },
      { en: "Bab El Oued", ar: "باب الوادي" },
      { en: "El Harrach", ar: "الحراش" },
      { en: "Sidi M'Hamed", ar: "سيدي امحمد" },
      { en: "Kouba", ar: "القبة" },
      { en: "Hydra", ar: "حيدرة" },
      { en: "Bir Mourad Raïs", ar: "بئر مراد رايس" },
      { en: "Cheraga", ar: "الشراقة" },
      { en: "Zeralda", ar: "زرالدة" },
      { en: "Reghaia", ar: "رغاية" }
    ]
  },
  {
    code: 17, en: "Djelfa", ar: "الجلفة", doorPrice: 950, deskPrice: 500,
    miniStates: [
      { en: "Djelfa Center", ar: "الجلفة وسط" },
      { en: "Hassi Bahbah", ar: "حاسي بحبح" },
      { en: "Ain Oussera", ar: "عين وسارة" },
      { en: "Messaâd", ar: "مسعد" },
      { en: "Dar Chioukh", ar: "دار الشيوخ" }
    ]
  },
  {
    code: 18, en: "Jijel", ar: "جيجل", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Jijel Center", ar: "جيجل وسط" },
      { en: "Taher", ar: "الطاهير" },
      { en: "El Milia", ar: "الميلية" },
      { en: "Chekfa", ar: "الشقفة" },
      { en: "Ziama Mansouriah", ar: "زيامة منصورية" }
    ]
  },
  {
    code: 19, en: "Sétif", ar: "سطيف", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Sétif Center", ar: "سطيف وسط" },
      { en: "El Eulma", ar: "العلمة" },
      { en: "Ain Oulmene", ar: "عين ولمان" },
      { en: "Ain Arnat", ar: "عين أرنات" },
      { en: "Bouandas", ar: "بوعنداس" },
      { en: "Salah Bey", ar: "صالح باي" }
    ]
  },
  {
    code: 20, en: "Saïda", ar: "سعيدة", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "Saïda Center", ar: "سعيدة وسط" },
      { en: "Ain El Hadjar", ar: "عين الحجر" },
      { en: "Hassasna", ar: "الحساسنة" },
      { en: "Ouled Brahim", ar: "أولاد براهيم" },
      { en: "Youb", ar: "يوب" }
    ]
  },
  {
    code: 21, en: "Skikda", ar: "سكيكدة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Skikda Center", ar: "سكيكدة وسط" },
      { en: "El Harrouch", ar: "الحروش" },
      { en: "Collo", ar: "القل" },
      { en: "Azzaba", ar: "عزابة" },
      { en: "Tamalous", ar: "تمالوس" },
      { en: "Sidi Mezghiche", ar: "سيدي مزغيش" }
    ]
  },
  {
    code: 22, en: "Sidi Bel Abbès", ar: "سيدي بلعباس", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Sidi Bel Abbès Center", ar: "سيدي بلعباس وسط" },
      { en: "Sfisef", ar: "سفيزف" },
      { en: "Telagh", ar: "تلاغ" },
      { en: "Ben Badis", ar: "بن باديس" },
      { en: "Mostefa Ben Brahim", ar: "مصطفى بن براهيم" }
    ]
  },
  {
    code: 23, en: "Annaba", ar: "عنابة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Annaba Center", ar: "عنابة وسط" },
      { en: "El Bouni", ar: "البوني" },
      { en: "Sidi Amar", ar: "سيدي عمار" },
      { en: "El Hadjar", ar: "الحجار" },
      { en: "Berrahal", ar: "برحال" }
    ]
  },
  {
    code: 24, en: "Guelma", ar: "قالمة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Guelma Center", ar: "قالمة وسط" },
      { en: "Oued Zenati", ar: "وادي الزناتي" },
      { en: "Bouchegouf", ar: "بوشقوف" },
      { en: "Heliopolis", ar: "هيليوبوليس" },
      { en: "Hammam Debagh", ar: "حمام دباغ" }
    ]
  },
  {
    code: 25, en: "Constantine", ar: "قسنطينة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Constantine Center", ar: "قسنطينة وسط" },
      { en: "El Khroub", ar: "الخروب" },
      { en: "Hamma Bouziane", ar: "حامة بوزيان" },
      { en: "Didouche Mourad", ar: "ديدوش مراد" },
      { en: "Zighoud Youcef", ar: "زيغود يوسف" }
    ]
  },
  {
    code: 26, en: "Médéa", ar: "المدية", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Médéa Center", ar: "المدية وسط" },
      { en: "Berrouaghia", ar: "البرواقية" },
      { en: "Ksar El Boukhari", ar: "قصر البخاري" },
      { en: "Tablat", ar: "تابلاط" },
      { en: "Beni Slimane", ar: "بني سليمان" }
    ]
  },
  {
    code: 27, en: "Mostaganem", ar: "مستغانم", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Mostaganem Center", ar: "مستغانم وسط" },
      { en: "Ain Nouissy", ar: "عين نويصي" },
      { en: "Sidi Ali", ar: "سيدي علي" },
      { en: "Bouguirat", ar: "بوقيرات" },
      { en: "Achacha", ar: "عشعاشة" }
    ]
  },
  {
    code: 28, en: "M'Sila", ar: "المسيلة", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "M'Sila Center", ar: "المسيلة وسط" },
      { en: "Bou Saâda", ar: "بوسعادة" },
      { en: "Sidi Aïssa", ar: "سيدي عيسى" },
      { en: "Ain El Hadjel", ar: "عين الحجل" },
      { en: "Maadid", ar: "المعاضيد" }
    ]
  },
  {
    code: 29, en: "Mascara", ar: "معسكر", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Mascara Center", ar: "معسكر وسط" },
      { en: "Sig", ar: "سيق" },
      { en: "Tighennif", ar: "تيغنيف" },
      { en: "Ghriss", ar: "غريس" },
      { en: "Mohammadia", ar: "المحمدية" }
    ]
  },
  {
    code: 30, en: "Ouargla", ar: "ورقلة", doorPrice: 700, deskPrice: 400,
    miniStates: [
      { en: "Ouargla Center", ar: "ورقلة وسط" },
      { en: "Hassi Messaoud", ar: "حاسي مسعود" },
      { en: "N'Goussa", ar: "نقوسة" },
      { en: "Rouissat", ar: "رويسات" },
      { en: "Ain Beida", ar: "عين البيضاء" }
    ]
  },
  {
    code: 31, en: "Oran", ar: "وهران", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Oran Center", ar: "وهران وسط" },
      { en: "Es Sénia", ar: "السانية" },
      { en: "Bir El Djir", ar: "بئر الجير" },
      { en: "Arzew", ar: "أرزيو" },
      { en: "Ain El Turk", ar: "عين الترك" },
      { en: "Gdyel", ar: "قديل" }
    ]
  },
  {
    code: 32, en: "El Bayadh", ar: "البيض", doorPrice: 1000, deskPrice: 550,
    miniStates: [
      { en: "El Bayadh Center", ar: "البيض وسط" },
      { en: "Rogassa", ar: "رقاصة" },
      { en: "El Abiodh Sidi Cheikh", ar: "الأبيض سيدي الشيخ" },
      { en: "Bougtob", ar: "بوقطب" },
      { en: "Brezina", ar: "بريزينة" }
    ]
  },
  {
    code: 33, en: "Illizi", ar: "إليزي", doorPrice: 1000, deskPrice: 650,
    miniStates: [
      { en: "Illizi Center", ar: "إليزي وسط" },
      { en: "In Amenas", ar: "إن أميناس" },
      { en: "Bordj Omar Driss", ar: "برج عمر إدريس" }
    ]
  },
  {
    code: 34, en: "Bordj Bou Arréridj", ar: "برج بوعريريج", doorPrice: 690, deskPrice: 450,
    miniStates: [
      { en: "Bordj Bou Arréridj Center", ar: "برج بوعريريج وسط" },
      { en: "Ras El Oued", ar: "رأس الوادي" },
      { en: "Medjana", ar: "مجّانة" },
      { en: "Mansoura", ar: "المنصورة" },
      { en: "Bordj Ghedir", ar: "برج غدير" }
    ]
  },
  {
    code: 35, en: "Boumerdès", ar: "بومرداس", doorPrice: 690, deskPrice: 450,
    miniStates: [
      { en: "Boumerdès Center", ar: "بومرداس وسط" },
      { en: "Dellys", ar: "دلس" },
      { en: "Boudouaou", ar: "بودواو" },
      { en: "Khemis El Khechna", ar: "خميس الخشنة" },
      { en: "Bordj Menaïel", ar: "برج منايل" }
    ]
  },
  {
    code: 36, en: "El Tarf", ar: "الطارف", doorPrice: 690, deskPrice: 450,
    miniStates: [
      { en: "El Tarf Center", ar: "الطارف وسط" },
      { en: "El Kala", ar: "القالة" },
      { en: "Dréan", ar: "ذرعان" },
      { en: "Besbes", ar: "البسباس" },
      { en: "Ben M'Hidi", ar: "بن مهيدي" }
    ]
  },
  {
    code: 37, en: "Tindouf", ar: "تندوف", doorPrice: 1000, deskPrice: 650,
    miniStates: [
      { en: "Tindouf Center", ar: "تندوف وسط" },
      { en: "Oum el Assel", ar: "أم العسل" }
    ]
  },
  {
    code: 38, en: "Tissemsilt", ar: "تسمسيلت", doorPrice: 700, deskPrice: 400,
    miniStates: [
      { en: "Tissemsilt Center", ar: "تسمسيلت وسط" },
      { en: "Lardjem", ar: "لارجام" },
      { en: "Theniet El Had", ar: "ثنية الحد" },
      { en: "Khemisti", ar: "خميستي" }
    ]
  },
  {
    code: 39, en: "El Oued", ar: "الوادي", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "El Oued Center", ar: "الوادي وسط" },
      { en: "Guemar", ar: "قمار" },
      { en: "Bayadha", ar: "البياضة" },
      { en: "Robbah", ar: "رباح" },
      { en: "Kouinine", ar: "كوينين" }
    ]
  },
  {
    code: 40, en: "Khenchela", ar: "خنشلة", doorPrice: 550, deskPrice: 450,
    miniStates: [
      { en: "Khenchela Center", ar: "خنشلة وسط" },
      { en: "Chechar", ar: "ششار" },
      { en: "Kais", ar: "قايس" },
      { en: "Bouhmama", ar: "بوحمامة" },
      { en: "El Hamma", ar: "الحامة" }
    ]
  },
  {
    code: 41, en: "Souk Ahras", ar: "سوق أهراس", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Souk Ahras Center", ar: "سوق أهراس وسط" },
      { en: "Sedrata", ar: "سدراتة" },
      { en: "Merahna", ar: "المراهنة" },
      { en: "Taoura", ar: "تاورة" },
      { en: "Haddada", ar: "الحدادة" }
    ]
  },
  {
    code: 42, en: "Tipaza", ar: "تيبازة", doorPrice: 750, deskPrice: 400,
    miniStates: [
      { en: "Tipaza Center", ar: "تيبازة وسط" },
      { en: "Cherchell", ar: "شرشال" },
      { en: "Koléa", ar: "القليعة" },
      { en: "Hadjout", ar: "حجوط" },
      { en: "Damous", ar: "الداموس" },
      { en: "Bou Ismail", ar: "بوسماعيل" }
    ]
  },
  {
    code: 43, en: "Mila", ar: "ميلة", doorPrice: 650, deskPrice: 450,
    miniStates: [
      { en: "Mila Center", ar: "ميلة وسط" },
      { en: "Chelghoum Laïd", ar: "شلغوم العيد" },
      { en: "Tajenanet", ar: "تاجنانت" },
      { en: "Grarem Gouga", ar: "قرارم قوقة" },
      { en: "Teleghma", ar: "تلاغمة" }
    ]
  },
  {
    code: 44, en: "Aïn Defla", ar: "عين الدفلى", doorPrice: 700, deskPrice: 400,
    miniStates: [
      { en: "Aïn Defla Center", ar: "عين الدفلى وسط" },
      { en: "Khemis Miliana", ar: "خميس مليانة" },
      { en: "Miliana", ar: "مليانة" },
      { en: "El Attaf", ar: "العطاف" },
      { en: "Djendel", ar: "جندل" }
    ]
  },
  {
    code: 45, en: "Naâma", ar: "النعامة", doorPrice: 950, deskPrice: 450,
    miniStates: [
      { en: "Naâma Center", ar: "النعامة وسط" },
      { en: "Mécheria", ar: "مشرية" },
      { en: "Ain Sefra", ar: "عين الصفراء" },
      { en: "Moghrar", ar: "مغرار" }
    ]
  },
  {
    code: 46, en: "Aïn Témouchent", ar: "عين تموشنت", doorPrice: 700, deskPrice: 400,
    miniStates: [
      { en: "Aïn Témouchent Center", ar: "عين تموشنت وسط" },
      { en: "Beni Saf", ar: "بني صاف" },
      { en: "Hammam Bouhadjar", ar: "حمام بوحجر" },
      { en: "El Malah", ar: "الملاح" }
    ]
  },
  {
    code: 47, en: "Ghardaïa", ar: "غرداية", doorPrice: 850, deskPrice: 500,
    miniStates: [
      { en: "Ghardaïa Center", ar: "غرداية وسط" },
      { en: "Metlili", ar: "متليلي" },
      { en: "El Guerrara", ar: "القرارة" },
      { en: "Bounoura", ar: "بنورة" },
      { en: "Zelfana", ar: "زلفانة" }
    ]
  },
  {
    code: 48, en: "Relizane", ar: "غليزان", doorPrice: 700, deskPrice: 450,
    miniStates: [
      { en: "Relizane Center", ar: "غليزان وسط" },
      { en: "Ohed Rhiou", ar: "وادي ارهيو" },
      { en: "Mazouna", ar: "مازونة" },
      { en: "Yellel", ar: "يلل" },
      { en: "Ammi Moussa", ar: "عمي موسى" }
    ]
  },
  {
    code: 49, en: "Timimoun", ar: "تيميمون", doorPrice: 1300, deskPrice: 650,
    miniStates: [
      { en: "Timimoun Center", ar: "تيميمون وسط" },
      { en: "Aougrout", ar: "أوقروت" },
      { en: "Charouine", ar: "شروين" }
    ]
  },
  {
    code: 50, en: "Bordj Baji Mokhtar", ar: "برج باجي مختار", doorPrice: 1400, deskPrice: 650,
    miniStates: [
      { en: "Bordj Baji Mokhtar Center", ar: "برج باجي مختار وسط" },
      { en: "Timiaouine", ar: "تيمياوين" }
    ]
  },
  {
    code: 51, en: "Ouled Djellal", ar: "أولاد جلال", doorPrice: 850, deskPrice: 450,
    miniStates: [
      { en: "Ouled Djellal Center", ar: "أولاد جلال وسط" },
      { en: "Sidi Khaled", ar: "سيدي خالد" },
      { en: "Doucen", ar: "الدوسن" }
    ]
  },
  {
    code: 52, en: "Béni Abbès", ar: "بني عباس", doorPrice: 900, deskPrice: 450,
    miniStates: [
      { en: "Béni Abbès Center", ar: "بني عباس وسط" },
      { en: "Kerzaz", ar: "كرزاز" },
      { en: "El Ouata", ar: "الواتة" }
    ]
  },
  {
    code: 53, en: "In Salah", ar: "عين صالح", doorPrice: 1400, deskPrice: 650,
    miniStates: [
      { en: "In Salah Center", ar: "عين صالح وسط" },
      { en: "Foggaret Ezzaouia", ar: "فقارة الزوى" },
      { en: "In Ghar", ar: "إين غار" }
    ]
  },
  {
    code: 54, en: "In Guezzam", ar: "عين قزام", doorPrice: 1400, deskPrice: 650,
    miniStates: [
      { en: "In Guezzam Center", ar: "عين قزام وسط" },
      { en: "Tin Zaouatine", ar: "تين زواتين" }
    ]
  },
  {
    code: 55, en: "Touggourt", ar: "تقرت", doorPrice: 900, deskPrice: 450,
    miniStates: [
      { en: "Touggourt Center", ar: "تقرت وسط" },
      { en: "Temacine", ar: "تماسين" },
      { en: "Megarine", ar: "المقارن" },
      { en: "Taibet", ar: "الطيبات" }
    ]
  },
  {
    code: 56, en: "Djanet", ar: "جانت", doorPrice: 1500, deskPrice: 650,
    miniStates: [
      { en: "Djanet Center", ar: "جانت وسط" },
      { en: "Bordj El Haouas", ar: "برج الحواس" }
    ]
  },
  {
    code: 57, en: "El M'Ghair", ar: "المغير", doorPrice: 800, deskPrice: 450,
    miniStates: [
      { en: "El M'Ghair Center", ar: "المغير وسط" },
      { en: "Djamaa", ar: "جامعة" },
      { en: "Oum Touyour", ar: "أم الطيور" }
    ]
  },
  {
    code: 58, en: "El Meniaa", ar: "المنيعة", doorPrice: 900, deskPrice: 450,
    miniStates: [
      { en: "El Meniaa Center", ar: "المنيعة وسط" },
      { en: "Hassi Gara", ar: "حاسي القارة" }
    ]
  }
];

export const translations = {
  en: {
    appTitle: "SBB TECH STORE",
    appSubtitle: "Cyber_Hardware_Hub",
    catalogue: "Catalogue",
    purchaseLogs: "System Purchase Logs",
    adminDeck: "Admin Deck",
    authenticate: "Authenticate",
    disconnect: "Disconnect",
    searchPlaceholder: "Search high-performance hardware...",
    all: "All",
    inStock: "IN STOCK",
    outOfStock: "OUT OF STOCK",
    hotItems: "HOT: {count} LEFT",
    unitCost: "UNIT COST",
    inspectCore: "Inspect Core",
    buyNow: "Buy Now",
    directCheckout: "Direct COD Checkout",
    codNotice: "Payment is strictly Cash on Delivery (COD). No prepayment required.",
    fullNameLabel: "Full Name *",
    fullNamePlaceholder: "e.g., Mohamed Amine",
    phoneLabel: "Phone Number (Algerian Mobile) *",
    phonePlaceholder: "e.g., 0550 12 34 56",
    stateLabel: "State / Wilaya (Algeria) *",
    selectState: "Select your Wilaya",
    addressLabel: "Door Home Address *",
    addressPlaceholder: "e.g., House No. 24, Rue Pasteur",
    submitOrderButton: "Confirm Purchase (Pay on Delivery)",
    cancelButton: "Cancel",
    fillRequiredWarning: "Please enter all required security details to file the purchase.",
    invalidPhoneWarning: "Please enter a valid Algerian phone number starting with 05, 06, or 07 (9 or 10 digits).",
    orderingProgress: "TRANSMITTING_ORDER_LOGS...",
    orderSuccessTitle: "Order Submitted Successfully!",
    orderSuccessMsg: "Your SBB Tech purchase logs have been authorized. We will dial your phone number shortly to verify credentials and initiate dispatch.",
    orderIdLabel: "Security Order ID",
    destinationLabel: "Destination Vector",
    totalLabel: "NET_TOTAL",
    orderStatusPending: "Pending",
    orderStatusProcessing: "Processing",
    orderStatusShipped: "Shipped",
    orderStatusCompleted: "Completed",
    orderStatusCancelled: "Cancelled",
    adminControlCenter: "ADMIN_CONTROL_CENTER",
    adminSubtitle: "SBB TECH STORE ADMINISTRATIVE DIRECTORIES // SECURE_PORT: 3000",
    manageInventory: "Manage Inventory",
    reviewOrders: "Review Orders",
    totalNodes: "Total Active Nodes",
    inventoryValue: "Estimated Inventory Value",
    salesVolume: "Total Sales Volume",
    activeInventoryDb: "Active Inventory Database",
    itemsCount: "Items",
    insertNewCore: "Insert New Core",
    modifySystemNode: "Modify System Node",
    sysNameLabel: "System Component Name *",
    priceLabel: "Price (DA) *",
    stockLabel: "Initial Inventory *",
    categoryLabel: "Node Category *",
    vectorUrlLabel: "Vector Image URL",
    specificationsLabel: "Module Specifications / Description *",
    applyUpgrade: "Apply Upgrade",
    initializeCore: "Initialize Core",
    reloadLogs: "[Reload Logs]",
    reloadInventory: "[Reload Data]",
    clientNodeId: "Client Node ID",
    manifest: "Manifest",
    backToCatalogue: "Back to Catalogue",
    accessDenied: "ACCESS_DENIED",
    noCompletedPurchases: "LOGS_EMPTY: NO COMPLETED PURCHASES FOUND",
    authRequiredTitle: "User Authentication Required",
    authRequiredMsg: "Sign in to your SBB Security Profile to retrieve checkout logs and tracking information.",
    adminClearanceRequired: "ADMIN_CLEARANCE_REQUIRED",
    adminClearanceTip: "Tip: Log in with sbouragbi5@gmail.com to automatically gain administrator clearance.",
    userAuthRequired: "User Authentication Required",
    userAuthRequiredDesc: "Sign in to your SBB Security Profile to retrieve checkout logs and tracking information.",
    retrievingSecurePurchaseFiles: "RETRIEVING_SECURE_PURCHASE_FILES...",
    logsEmpty: "LOGS_EMPTY: NO COMPLETED PURCHASES FOUND",
    systemPurchaseLogs: "System Purchase Logs",
    sysId: "SYS_ID",
    destination: "Destination Vector",
    total: "Total",
    deliveryOptionLabel: "Delivery Method *",
    doorDelivery: "Door Home Delivery 🏠",
    deskDelivery: "Stop Desk Delivery (Office Pick-up) 🏢",
    miniStateLabel: "Mini-State / Commune *",
    selectMiniState: "Select your Commune",
    deliveryPriceLabel: "Delivery Charge",
    totalWithDeliveryLabel: "NET_TOTAL + DELIVERY",
    deskAddressNotice: "Stop Desk: Collect package from the local hub in your selected Wilaya.",
    backToCart: "Back to Shopping Deck",
    nextButton: "Next Vector",
    otherCommuneOption: "Other (Type manually) ✏️",
    customCommuneLabel: "Enter Commune Name *",
    customCommunePlaceholder: "e.g., Ouled Fayet"
  },
  ar: {
    appTitle: "متجر SBB تيك",
    appSubtitle: "مركز العتاد السيبراني",
    catalogue: "الكتالوج",
    purchaseLogs: "سجل الطلبيات",
    adminDeck: "لوحة الإدارة",
    authenticate: "تسجيل الدخول",
    disconnect: "تسجيل الخروج",
    searchPlaceholder: "البحث عن عتاد عالي الأداء...",
    all: "الكل",
    inStock: "متوفر في المخزن",
    outOfStock: "نفذت الكمية",
    hotItems: "ساخن: متبقي {count} قطع!",
    unitCost: "سعر الوحدة",
    inspectCore: "معاينة التفاصيل",
    buyNow: "شراء الآن",
    directCheckout: "الدفع عند الاستلام مباشر",
    codNotice: "الدفع عند الاستلام متاح (COD). لا حاجة للدفع المسبق.",
    fullNameLabel: "الاسم الكامل *",
    fullNamePlaceholder: "مثال: محمد أمين",
    phoneLabel: "رقم الهاتف (موبايل الجزائر) *",
    phonePlaceholder: "مثال: 0550 12 34 56",
    stateLabel: "الولاية (الجزائر) *",
    selectState: "اختر ولايتك من القائمة",
    addressLabel: "عنوان المنزل الدقيق *",
    addressPlaceholder: "مثال: حي السلام، رقم المنزل 24",
    submitOrderButton: "تأكيد الشراء (الدفع عند الاستلام)",
    cancelButton: "إلغاء",
    fillRequiredWarning: "يرجى إدخال جميع التفاصيل المطلوبة لتسجيل الطلبية.",
    invalidPhoneWarning: "يرجى إدخال رقم هاتف جزائري صحيح يبدأ بـ 05 أو 06 أو 07 ويتكون من 9 إلى 10 أرقام.",
    orderingProgress: "جاري إرسال بيانات الطلب...",
    orderSuccessTitle: "تم تسجيل طلبك بنجاح!",
    orderSuccessMsg: "تم تسجيل طلبيتك بنجاح في متجر SBB. سنتصل بك عبر الهاتف في أقرب وقت لتأكيد طلبك وتوصيله إليك.",
    orderIdLabel: "رقم الطلبية الأمني",
    destinationLabel: "مكان التوصيل",
    totalLabel: "المجموع الصافي",
    orderStatusPending: "قيد الانتظار",
    orderStatusProcessing: "قيد المعالجة",
    orderStatusShipped: "تم الشحن",
    orderStatusCompleted: "اكتمل الطلب",
    orderStatusCancelled: "تم الإلغاء",
    adminControlCenter: "مركز التحكم للإدارة",
    adminSubtitle: "أدلة الإدارة لمتجر SBB // المنفذ الآمن: 3000",
    manageInventory: "إدارة المخزن",
    reviewOrders: "مراجعة الطلبات",
    totalNodes: "إجمالي المنتجات",
    inventoryValue: "القيمة التقديرية للمخزن",
    salesVolume: "إجمالي المبيعات",
    activeInventoryDb: "قاعدة بيانات المخزن النشط",
    itemsCount: "عنصر",
    insertNewCore: "إضافة منتج جديد",
    modifySystemNode: "تعديل مواصفات المنتج",
    sysNameLabel: "اسم المنتج / المكون *",
    priceLabel: "السعر (بالدينار جزائري DA) *",
    stockLabel: "الكمية الابتدائية *",
    categoryLabel: "فئة المنتج *",
    vectorUrlLabel: "رابط الصورة التوضيحية",
    specificationsLabel: "مواصفات المنتج والتفاصيل *",
    applyUpgrade: "تطبيق التحديث",
    initializeCore: "إدراج المنتج",
    reloadLogs: "[تحديث السجل]",
    reloadInventory: "[تحديث البيانات]",
    clientNodeId: "رقم تعريف العميل",
    manifest: "المحتويات",
    backToCatalogue: "العودة للكتالوج",
    accessDenied: "تم رفض صلاحية الدخول",
    noCompletedPurchases: "السجل فارغ: لا توجد مشتريات مكتملة",
    authRequiredTitle: "مطلوب تسجيل الدخول",
    authRequiredMsg: "يرجى تسجيل الدخول لحسابك السكيورتي لتتمكن من معاينة طلبياتك ومتابعتها.",
    adminClearanceRequired: "مطلوب ترخيص إدارة كامل",
    adminClearanceTip: "نصيحة: سجل الدخول بالبريد الإلكتروني sbouragbi5@gmail.com للحصول على صلاحيات الإدارة تلقائياً.",
    userAuthRequired: "مطلوب تسجيل الدخول",
    userAuthRequiredDesc: "يرجى تسجيل الدخول لحسابك السكيورتي لتتمكن من معاينة طلبياتك ومتابعتها.",
    retrievingSecurePurchaseFiles: "جاري استرداد ملفات الشراء الآمنة...",
    logsEmpty: "السجل فارغ: لم يتم العثور على مشتريات مكتملة",
    systemPurchaseLogs: "سجلات شراء النظام",
    sysId: "معرف النظام",
    destination: "مكان التوصيل",
    total: "المجموع الكلي",
    deliveryOptionLabel: "طريقة التوصيل *",
    doorDelivery: "توصيل لباب المنزل 🏠",
    deskDelivery: "استلام من مكتب بريد الاستلام 🏢",
    miniStateLabel: "البلدية / المنطقة *",
    selectMiniState: "اختر البلدية",
    deliveryPriceLabel: "تكلفة التوصيل",
    totalWithDeliveryLabel: "المجموع الكلي مع التوصيل",
    deskAddressNotice: "استلام من المكتب: يرجى التوجه لمركز الاستلام المحلي في الولاية المختارة لتلقي الطرد.",
    backToCart: "العودة لسلة التسوق",
    nextButton: "الخطوة التالية",
    otherCommuneOption: "أخرى (كتابة يدوية) ✏️",
    customCommuneLabel: "أدخل اسم البلدية *",
    customCommunePlaceholder: "مثال: أولاد فايت"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en, replacements?: { [key: string]: string | number }) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("sbb_language");
    return (saved === "en" || saved === "ar") ? saved : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("sbb_language", lang);
  };

  const t = (key: keyof typeof translations.en, replacements?: { [key: string]: string | number }): string => {
    let text = translations[language][key] || translations.en[key] || "";
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const isRtl = language === "ar";

  useEffect(() => {
    // Set text direction on document element
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "font-sans text-right" : "font-sans text-left"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
