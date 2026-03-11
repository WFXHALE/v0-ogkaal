export type Language = "en" | "hi" | "ur" | "hinglish"

export type Translations = {
  // Navigation
  nav: {
    home: string
    propFirms: string
    intelligence: string
    indicators: string
    material: string
    vipSignals: string
    vipGroup: string
    blog: string
    smcGuide: string
    mentorship: string
    about: string
    tradeDashboard: string
    fundedTools: string
    performance: string
  }
  // Hero Section
  hero: {
    badge: string
    title: string
    subtitle1: string
    subtitle2: string
    description: string
  }
  // What You Learn
  learn: {
    title: string
    topics: {
      marketStructure: string
      liquidity: string
      bos: string
      fvg: string
      orderBlocks: string
      entryModels: string
      riskManagement: string
      psychology: string
      institutional: string
    }
  }
  // Mentorship Program
  mentorship: {
    badge: string
    title: string
    description: string
    card1Title: string
    card1Desc: string
    card2Title: string
    card2Desc: string
    card3Title: string
    card3Desc: string
    goalText: string
  }
  // Navigation Cards
  cards: {
    mentorshipTitle: string
    mentorshipDesc: string
    vipGroupTitle: string
    vipGroupDesc: string
    tradeTitle: string
    tradeDesc: string
    fundedTitle: string
    fundedDesc: string
    marketTitle: string
    marketDesc: string
    booksTitle: string
    booksDesc: string
    exploreButton: string
    sectionTitle: string
    sectionSubtitle: string
  }
  // FAQ
  faq: {
    title: string
    q1: string
    a1: string
    q2: string
    a2: string
    q3: string
    a3: string
    q4: string
    a4: string
  }
  // Intelligence Page
  intelligence: {
    title: string
    subtitle: string
    correlations: string
    economicCalendar: string
  }
  // Indicators Page
  indicators: {
    title: string
    subtitle: string
    viewButton: string
  }
  // Prop Firms Page
  propFirms: {
    title: string
    subtitle: string
    compareButton: string
  }
  // Blog Page
  blog: {
    title: string
    subtitle: string
    readMore: string
    educationTitle: string
  }
  // Shared Buttons
  buttons: {
    enroll: string
    joinNow: string
    learnMore: string
    getStarted: string
    viewAll: string
  }
  // Language Picker
  language: {
    label: string
    english: string
    hindi: string
    urdu: string
    hinglish: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: "Home",
      propFirms: "Prop Firms",
      intelligence: "Intelligence",
      indicators: "Indicators",
      material: "Material",
      vipSignals: "VIP Signals",
      vipGroup: "VIP Group",
      blog: "Blog",
      smcGuide: "SMC Guide",
      mentorship: "Mentorship",
      about: "About",
      tradeDashboard: "Trade Dashboard",
      fundedTools: "Funded Tools",
      performance: "Performance",
    },
    hero: {
      badge: "SMC & ICT Trading Mentor",
      title: "OG KAAL TRADER",
      subtitle1: "Professional trader and mentor teaching",
      subtitle2: "Smart Money Concepts (SMC) and ICT trading models",
      description: "Trading since 2020. Helped traders pass funded accounts and develop disciplined trading systems.",
    },
    learn: {
      title: "What You Will Learn",
      topics: {
        marketStructure: "Market Structure",
        liquidity: "Liquidity Concepts",
        bos: "Break of Structure and CHOCH",
        fvg: "Fair Value Gaps",
        orderBlocks: "Order Blocks",
        entryModels: "Entry Models",
        riskManagement: "Risk Management",
        psychology: "Trade Psychology",
        institutional: "Institutional Market Logic",
      },
    },
    mentorship: {
      badge: "Featured Program",
      title: "Mentorship 2.0 Program",
      description:
        "The mentorship program includes structured learning of SMC and ICT concepts. Students go through basic to advanced market models and learn how to identify liquidity, structure shifts and institutional order flow. The program focuses on building consistent traders through risk management and proper market understanding.",
      card1Title: "Structured Learning",
      card1Desc: "Basic to advanced concepts",
      card2Title: "Market Analysis",
      card2Desc: "Live trading sessions",
      card3Title: "Risk Management",
      card3Desc: "Disciplined trading",
      goalText:
        "The goal of this platform is to help traders develop discipline and understanding of market structure instead of relying on random signals.",
    },
    cards: {
      mentorshipTitle: "Mentorship",
      mentorshipDesc: "Learn SMC & ICT strategies",
      vipGroupTitle: "VIP Group",
      vipGroupDesc: "Join the trading signals community",
      tradeTitle: "Trade Dashboard",
      tradeDesc: "Monitor trades and performance",
      fundedTitle: "Funded Tools",
      fundedDesc: "Calculators and risk management",
      marketTitle: "Market Overview",
      marketDesc: "Live prices and charts",
      booksTitle: "Books",
      booksDesc: "Trading resources and guides",
      exploreButton: "Explore",
      sectionTitle: "Explore Platform",
      sectionSubtitle: "Navigate to different sections and tools available on the platform",
    },
    faq: {
      title: "Frequently Asked Questions",
      q1: "What trading concepts are taught?",
      a1: "The mentorship covers Smart Money Concepts (SMC) and ICT models including market structure, liquidity, order blocks, fair value gaps, CHOCH, BOS, and institutional order flow.",
      q2: "Is this suitable for beginners?",
      a2: "Yes, the program starts from basic concepts and gradually moves to advanced topics. Students with no prior trading experience can join and learn step by step.",
      q3: "What is the duration of the program?",
      a3: "The mentorship is a self-paced program. Students can learn at their own speed and revisit recorded sessions anytime. Most students complete core modules within 8-12 weeks.",
      q4: "Do you provide trading signals?",
      a4: "The VIP group includes trade setups and analysis, but the main focus is education. The goal is to teach traders to identify their own setups rather than depend on signals.",
    },
    intelligence: {
      title: "Market Intelligence",
      subtitle: "Real-time market data, news, and insights",
      correlations: "Market Correlations",
      economicCalendar: "Economic Calendar",
    },
    indicators: {
      title: "Trading Indicators",
      subtitle: "Professional TradingView indicators for SMC & ICT analysis",
      viewButton: "View on TradingView",
    },
    propFirms: {
      title: "Prop Firms Comparison",
      subtitle: "Compare funding programs and find the best fit for your trading style",
      compareButton: "Compare",
    },
    blog: {
      title: "Trading Blog",
      subtitle: "Articles, insights, and educational content",
      readMore: "Read more",
      educationTitle: "Trading Education",
    },
    buttons: {
      enroll: "Enroll Now",
      joinNow: "Join Now",
      learnMore: "Learn More",
      getStarted: "Get Started",
      viewAll: "View All",
    },
    language: {
      label: "Language",
      english: "English",
      hindi: "हिन्दी",
      urdu: "اردو",
      hinglish: "Hinglish",
    },
  },
  hi: {
    nav: {
      home: "होम",
      propFirms: "प्रॉप फर्म्स",
      intelligence: "इंटेलिजेंस",
      indicators: "इंडिकेटर्स",
      material: "मैटेरियल",
      vipSignals: "VIP सिग्नल्स",
      vipGroup: "VIP ग्रुप",
      blog: "ब्लॉग",
      smcGuide: "SMC गाइड",
      mentorship: "मेंटरशिप",
      about: "हमारे बारे में",
      tradeDashboard: "ट्रेड डैशबोर्ड",
      fundedTools: "फंडेड टूल्स",
      performance: "परफॉर्मेंस",
    },
    hero: {
      badge: "SMC और ICT ट्रेडिंग मेंटर",
      title: "OG KAAL TRADER",
      subtitle1: "प्रोफेशनल ट्रेडर और मेंटर",
      subtitle2: "Smart Money Concepts (SMC) और ICT ट्रेडिंग मॉडल सिखाते हैं",
      description: "2020 से ट्रेडिंग कर रहे हैं। ट्रेडर्स को फंडेड अकाउंट पास करने और अनुशासित ट्रेडिंग सिस्टम विकसित करने में मदद की है।",
    },
    learn: {
      title: "आप क्या सीखेंगे",
      topics: {
        marketStructure: "मार्केट स्ट्रक्चर",
        liquidity: "लिक्विडिटी कॉन्सेप्ट्स",
        bos: "ब्रेक ऑफ स्ट्रक्चर और CHOCH",
        fvg: "फेयर वैल्यू गैप्स",
        orderBlocks: "ऑर्डर ब्लॉक्स",
        entryModels: "एंट्री मॉडल्स",
        riskManagement: "रिस्क मैनेजमेंट",
        psychology: "ट्रेड साइकोलॉजी",
        institutional: "इंस्टीट्यूशनल मार्केट लॉजिक",
      },
    },
    mentorship: {
      badge: "फीचर्ड प्रोग्राम",
      title: "मेंटरशिप 2.0 प्रोग्राम",
      description:
        "मेंटरशिप प्रोग्राम में SMC और ICT कॉन्सेप्ट्स की स्ट्रक्चर्ड लर्निंग शामिल है। स्टूडेंट्स बेसिक से एडवांस मार्केट मॉडल्स से गुज़रते हैं और लिक्विडिटी, स्ट्रक्चर शिफ्ट्स और इंस्टीट्यूशनल ऑर्डर फ्लो को आइडेंटिफाई करना सीखते हैं। प्रोग्राम रिस्क मैनेजमेंट और सही मार्केट समझ के ज़रिये कंसिस्टेंट ट्रेडर्स बनाने पर फोकस करता है।",
      card1Title: "स्ट्रक्चर्ड लर्निंग",
      card1Desc: "बेसिक से एडवांस कॉन्सेप्ट्स",
      card2Title: "मार्केट एनालिसिस",
      card2Desc: "लाइव ट्रेडिंग सेशंस",
      card3Title: "रिस्क मैनेजमेंट",
      card3Desc: "अनुशासित ट्रेडिंग",
      goalText:
        "इस प्लेटफॉर्म का लक्ष्य ट्रेडर्स को अनुशासन और मार्केट स्ट्रक्चर की समझ विकसित करने में मदद करना है, रैंडम सिग्नल्स पर निर्भर रहने की जगह।",
    },
    cards: {
      mentorshipTitle: "मेंटरशिप",
      mentorshipDesc: "SMC और ICT स्ट्रैटेजी सीखें",
      vipGroupTitle: "VIP ग्रुप",
      vipGroupDesc: "ट्रेडिंग सिग्नल्स कम्युनिटी में शामिल हों",
      tradeTitle: "ट्रेड डैशबोर्ड",
      tradeDesc: "ट्रेड्स और परफॉर्मेंस मॉनिटर करें",
      fundedTitle: "फंडेड टूल्स",
      fundedDesc: "कैलकुलेटर और रिस्क मैनेजमेंट",
      marketTitle: "मार्केट ओवरव्यू",
      marketDesc: "लाइव प्राइस और चार्ट्स",
      booksTitle: "किताबें",
      booksDesc: "ट्रेडिंग रिसोर्सेज और गाइड्स",
      exploreButton: "देखें",
      sectionTitle: "प्लेटफॉर्म एक्सप्लोर करें",
      sectionSubtitle: "प्लेटफॉर्म पर उपलब्ध विभिन्न सेक्शन और टूल्स तक पहुंचें",
    },
    faq: {
      title: "अक्सर पूछे जाने वाले सवाल",
      q1: "कौन से ट्रेडिंग कॉन्सेप्ट्स सिखाए जाते हैं?",
      a1: "मेंटरशिप में Smart Money Concepts (SMC) और ICT मॉडल्स शामिल हैं जिसमें मार्केट स्ट्रक्चर, लिक्विडिटी, ऑर्डर ब्लॉक्स, फेयर वैल्यू गैप्स, CHOCH, BOS, और इंस्टीट्यूशनल ऑर्डर फ्लो है।",
      q2: "क्या यह बिगिनर्स के लिए उपयुक्त है?",
      a2: "हाँ, प्रोग्राम बेसिक कॉन्सेप्ट्स से शुरू होता है और धीरे-धीरे एडवांस टॉपिक्स की ओर बढ़ता है। बिना ट्रेडिंग एक्सपीरियंस वाले स्टूडेंट्स भी ज्वाइन कर सकते हैं और स्टेप बाय स्टेप सीख सकते हैं।",
      q3: "प्रोग्राम की अवधि क्या है?",
      a3: "मेंटरशिप एक सेल्फ-पेस्ड प्रोग्राम है। स्टूडेंट्स अपनी स्पीड से सीख सकते हैं और रिकॉर्डेड सेशंस को कभी भी दोबारा देख सकते हैं। ज़्यादातर स्टूडेंट्स 8-12 हफ़्तों में कोर मॉड्यूल्स पूरे कर लेते हैं।",
      q4: "क्या आप ट्रेडिंग सिग्नल्स प्रदान करते हैं?",
      a4: "VIP ग्रुप में ट्रेड सेटअप और एनालिसिस शामिल है, लेकिन मुख्य फोकस एजुकेशन पर है। लक्ष्य ट्रेडर्स को उनके खुद के सेटअप आइडेंटिफाई करना सिखाना है, सिग्नल्स पर निर्भर रहने की जगह।",
    },
    intelligence: {
      title: "मार्केट इंटेलिजेंस",
      subtitle: "रियल-टाइम मार्केट डेटा, न्यूज़, और इनसाइट्स",
      correlations: "मार्केट कोरिलेशंस",
      economicCalendar: "इकोनॉमिक कैलेंडर",
    },
    indicators: {
      title: "ट्रेडिंग इंडिकेटर्स",
      subtitle: "SMC और ICT एनालिसिस के लिए प्रोफेशनल TradingView इंडिकेटर्स",
      viewButton: "TradingView पर देखें",
    },
    propFirms: {
      title: "प्रॉप फर्म्स तुलना",
      subtitle: "फंडिंग प्रोग्राम्स की तुलना करें और अपनी ट्रेडिंग स्टाइल के लिए सबसे अच्छा खोजें",
      compareButton: "तुलना करें",
    },
    blog: {
      title: "ट्रेडिंग ब्लॉग",
      subtitle: "आर्टिकल्स, इनसाइट्स, और एजुकेशनल कंटेंट",
      readMore: "और पढ़ें",
      educationTitle: "ट्रेडिंग एजुकेशन",
    },
    buttons: {
      enroll: "अभी एनरोल करें",
      joinNow: "अभी ज्वाइन करें",
      learnMore: "और जानें",
      getStarted: "शुरू करें",
      viewAll: "सभी देखें",
    },
    language: {
      label: "भाषा",
      english: "English",
      hindi: "हिन्दी",
      urdu: "اردو",
      hinglish: "Hinglish",
    },
  },
  ur: {
    nav: {
      home: "ہوم",
      propFirms: "پراپ فرمز",
      intelligence: "انٹیلیجنس",
      indicators: "انڈیکیٹرز",
      material: "میٹریل",
      vipSignals: "VIP سگنلز",
      vipGroup: "VIP گروپ",
      blog: "بلاگ",
      smcGuide: "SMC گائیڈ",
      mentorship: "مینٹرشپ",
      about: "ہمارے بارے میں",
      tradeDashboard: "ٹریڈ ڈیش بورڈ",
      fundedTools: "فنڈڈ ٹولز",
      performance: "پرفارمنس",
    },
    hero: {
      badge: "SMC اور ICT ٹریڈنگ مینٹر",
      title: "OG KAAL TRADER",
      subtitle1: "پروفیشنل ٹریڈر اور مینٹر",
      subtitle2: "Smart Money Concepts (SMC) اور ICT ٹریڈنگ ماڈلز سکھاتے ہیں",
      description: "2020 سے ٹریڈنگ کر رہے ہیں۔ ٹریڈرز کو فنڈڈ اکاؤنٹس پاس کرنے اور ڈسپلنڈ ٹریڈنگ سسٹمز بنانے میں مدد کی ہے۔",
    },
    learn: {
      title: "آپ کیا سیکھیں گے",
      topics: {
        marketStructure: "مارکیٹ اسٹرکچر",
        liquidity: "لیکویڈیٹی کانسیپٹس",
        bos: "بریک آف اسٹرکچر اور CHOCH",
        fvg: "فیئر ویلیو گیپس",
        orderBlocks: "آرڈر بلاکس",
        entryModels: "انٹری ماڈلز",
        riskManagement: "رسک مینجمنٹ",
        psychology: "ٹریڈ سائیکالوجی",
        institutional: "انسٹیٹیوشنل مارکیٹ لاجک",
      },
    },
    mentorship: {
      badge: "فیچرڈ پروگرام",
      title: "مینٹرشپ 2.0 پروگرام",
      description:
        "مینٹرشپ پروگرام میں SMC اور ICT کانسیپٹس کی اسٹرکچرڈ لرننگ شامل ہے۔ اسٹوڈنٹس بیسک سے ایڈوانس مارکیٹ ماڈلز سے گزرتے ہیں اور لیکویڈیٹی، اسٹرکچر شفٹس اور انسٹیٹیوشنل آرڈر فلو کی شناخت کرنا سیکھتے ہیں۔ پروگرام رسک مینجمنٹ اور صحیح مارکیٹ سمجھ کے ذریعے کنسسٹنٹ ٹریڈرز بنانے پر فوکس کرتا ہے۔",
      card1Title: "اسٹرکچرڈ لرننگ",
      card1Desc: "بیسک سے ایڈوانس کانسیپٹس",
      card2Title: "مارکیٹ اینالیسس",
      card2Desc: "لائیو ٹریڈنگ سیشنز",
      card3Title: "رسک مینجمنٹ",
      card3Desc: "ڈسپلنڈ ٹریڈنگ",
      goalText:
        "اس پلیٹ فارم کا مقصد ٹریڈرز کو ڈسپلن اور مارکیٹ اسٹرکچر کی سمجھ پیدا کرنے میں مدد کرنا ہے، رینڈم سگنلز پر انحصار کرنے کی جگہ۔",
    },
    cards: {
      mentorshipTitle: "مینٹرشپ",
      mentorshipDesc: "SMC اور ICT اسٹریٹیجی سیکھیں",
      vipGroupTitle: "VIP گروپ",
      vipGroupDesc: "ٹریڈنگ سگنلز کمیونٹی میں شامل ہوں",
      tradeTitle: "ٹریڈ ڈیش بورڈ",
      tradeDesc: "ٹریڈز اور پرفارمنس مانیٹر کریں",
      fundedTitle: "فنڈڈ ٹولز",
      fundedDesc: "کیلکولیٹر اور رسک مینجمنٹ",
      marketTitle: "مارکیٹ اوورویو",
      marketDesc: "لائیو پرائسز اور چارٹس",
      booksTitle: "کتابیں",
      booksDesc: "ٹریڈنگ ریسورسز اور گائیڈز",
      exploreButton: "دیکھیں",
      sectionTitle: "پلیٹ فارم ایکسپلور کریں",
      sectionSubtitle: "پلیٹ فارم پر دستیاب مختلف سیکشنز اور ٹولز تک رسائی حاصل کریں",
    },
    faq: {
      title: "اکثر پوچھے جانے والے سوالات",
      q1: "کون سے ٹریڈنگ کانسیپٹس سکھائے جاتے ہیں؟",
      a1: "مینٹرشپ میں Smart Money Concepts (SMC) اور ICT ماڈلز شامل ہیں جس میں مارکیٹ اسٹرکچر، لیکویڈیٹی، آرڈر بلاکس، فیئر ویلیو گیپس، CHOCH، BOS، اور انسٹیٹیوشنل آرڈر فلو ہے۔",
      q2: "کیا یہ ابتدائی افراد کے لیے موزوں ہے؟",
      a2: "ہاں، پروگرام بیسک کانسیپٹس سے شروع ہوتا ہے اور آہستہ آہستہ ایڈوانس ٹاپکس کی طرف بڑھتا ہے۔ بغیر ٹریڈنگ تجربے والے اسٹوڈنٹس بھی شامل ہو سکتے ہیں اور قدم بہ قدم سیکھ سکتے ہیں۔",
      q3: "پروگرام کی مدت کیا ہے؟",
      a3: "مینٹرشپ ایک سیلف پیسڈ پروگرام ہے۔ اسٹوڈنٹس اپنی رفتار سے سیکھ سکتے ہیں اور ریکارڈ شدہ سیشنز کو کبھی بھی دوبارہ دیکھ سکتے ہیں۔ زیادہ تر اسٹوڈنٹس 8-12 ہفتوں میں بنیادی ماڈیولز مکمل کر لیتے ہیں۔",
      q4: "کیا آپ ٹریڈنگ سگنلز فراہم کرتے ہیں؟",
      a4: "VIP گروپ میں ٹریڈ سیٹ اپ اور اینالیسس شامل ہے، لیکن اصل فوکس تعلیم پر ہے۔ مقصد ٹریڈرز کو اپنے خود کے سیٹ اپ کی شناخت کرنا سکھانا ہے، سگنلز پر انحصار کرنے کی جگہ۔",
    },
    intelligence: {
      title: "مارکیٹ انٹیلیجنس",
      subtitle: "ریئل ٹائم مارکیٹ ڈیٹا، نیوز، اور بصیرت",
      correlations: "مارکیٹ کوریلیشنز",
      economicCalendar: "اقتصادی کیلنڈر",
    },
    indicators: {
      title: "ٹریڈنگ انڈیکیٹرز",
      subtitle: "SMC اور ICT اینالیسس کے لیے پروفیشنل TradingView انڈیکیٹرز",
      viewButton: "TradingView پر دیکھیں",
    },
    propFirms: {
      title: "پراپ فرمز موازنہ",
      subtitle: "فنڈنگ پروگرامز کا موازنہ کریں اور اپنی ٹریڈنگ اسٹائل کے لیے بہترین تلاش کریں",
      compareButton: "موازنہ کریں",
    },
    blog: {
      title: "ٹریڈنگ بلاگ",
      subtitle: "آرٹیکلز، بصیرت، اور تعلیمی مواد",
      readMore: "مزید پڑھیں",
      educationTitle: "ٹریڈنگ تعلیم",
    },
    buttons: {
      enroll: "ابھی اندراج کریں",
      joinNow: "ابھی شامل ہوں",
      learnMore: "مزید جانیں",
      getStarted: "شروع کریں",
      viewAll: "تمام دیکھیں",
    },
    language: {
      label: "زبان",
      english: "English",
      hindi: "हिन्दी",
      urdu: "اردو",
      hinglish: "Hinglish",
    },
  },
  hinglish: {
    nav: {
      home: "Home",
      propFirms: "Prop Firms",
      intelligence: "Intelligence",
      indicators: "Indicators",
      material: "Material",
      vipSignals: "VIP Signals",
      vipGroup: "VIP Group",
      blog: "Blog",
      smcGuide: "SMC Guide",
      mentorship: "Mentorship",
      about: "About",
      tradeDashboard: "Trade Dashboard",
      fundedTools: "Funded Tools",
      performance: "Performance",
    },
    hero: {
      badge: "SMC aur ICT Trading Mentor",
      title: "OG KAAL TRADER",
      subtitle1: "Professional trader aur mentor",
      subtitle2: "Smart Money Concepts (SMC) aur ICT trading models sikhaate hain",
      description: "2020 se trading kar rahe hain. Traders ko funded accounts pass karne aur disciplined trading systems develop karne mein madad ki hai.",
    },
    learn: {
      title: "Aap Kya Seekhenge",
      topics: {
        marketStructure: "Market Structure",
        liquidity: "Liquidity Concepts",
        bos: "Break of Structure aur CHOCH",
        fvg: "Fair Value Gaps",
        orderBlocks: "Order Blocks",
        entryModels: "Entry Models",
        riskManagement: "Risk Management",
        psychology: "Trade Psychology",
        institutional: "Institutional Market Logic",
      },
    },
    mentorship: {
      badge: "Featured Program",
      title: "Mentorship 2.0 Program",
      description:
        "Mentorship program mein SMC aur ICT concepts ki structured learning shamil hai. Students basic se advanced market models se guzarte hain aur liquidity, structure shifts aur institutional order flow ko identify karna seekhte hain. Program risk management aur sahi market samajh ke zariye consistent traders banana focus karta hai.",
      card1Title: "Structured Learning",
      card1Desc: "Basic se advanced concepts",
      card2Title: "Market Analysis",
      card2Desc: "Live trading sessions",
      card3Title: "Risk Management",
      card3Desc: "Disciplined trading",
      goalText:
        "Is platform ka goal traders ko discipline aur market structure ki samajh develop karne mein madad karna hai, random signals par depend rehne ki jagah.",
    },
    cards: {
      mentorshipTitle: "Mentorship",
      mentorshipDesc: "SMC aur ICT strategies seekhen",
      vipGroupTitle: "VIP Group",
      vipGroupDesc: "Trading signals community mein join karen",
      tradeTitle: "Trade Dashboard",
      tradeDesc: "Trades aur performance monitor karen",
      fundedTitle: "Funded Tools",
      fundedDesc: "Calculators aur risk management",
      marketTitle: "Market Overview",
      marketDesc: "Live prices aur charts",
      booksTitle: "Books",
      booksDesc: "Trading resources aur guides",
      exploreButton: "Explore",
      sectionTitle: "Platform Explore Karen",
      sectionSubtitle: "Platform par available different sections aur tools tak pahunchen",
    },
    faq: {
      title: "Frequently Asked Questions",
      q1: "Kaunse trading concepts sikhaaye jaate hain?",
      a1: "Mentorship mein Smart Money Concepts (SMC) aur ICT models shamil hain jismein market structure, liquidity, order blocks, fair value gaps, CHOCH, BOS, aur institutional order flow hai.",
      q2: "Kya yeh beginners ke liye suitable hai?",
      a2: "Haan, program basic concepts se shuru hota hai aur dheere dheere advanced topics ki taraf badhta hai. Bina trading experience wale students bhi join kar sakte hain aur step by step seekh sakte hain.",
      q3: "Program ki duration kya hai?",
      a3: "Mentorship ek self-paced program hai. Students apni speed se seekh sakte hain aur recorded sessions ko kabhi bhi dobara dekh sakte hain. Zyaadatar students 8-12 weeks mein core modules complete kar lete hain.",
      q4: "Kya aap trading signals provide karte hain?",
      a4: "VIP group mein trade setups aur analysis shamil hai, lekin main focus education par hai. Goal traders ko unke khud ke setups identify karna sikhana hai, signals par depend rehne ki jagah.",
    },
    intelligence: {
      title: "Market Intelligence",
      subtitle: "Real-time market data, news, aur insights",
      correlations: "Market Correlations",
      economicCalendar: "Economic Calendar",
    },
    indicators: {
      title: "Trading Indicators",
      subtitle: "SMC aur ICT analysis ke liye professional TradingView indicators",
      viewButton: "TradingView par dekhen",
    },
    propFirms: {
      title: "Prop Firms Comparison",
      subtitle: "Funding programs ki comparison karen aur apni trading style ke liye best dhundhen",
      compareButton: "Compare",
    },
    blog: {
      title: "Trading Blog",
      subtitle: "Articles, insights, aur educational content",
      readMore: "Aur padhein",
      educationTitle: "Trading Education",
    },
    buttons: {
      enroll: "Abhi Enroll Karen",
      joinNow: "Abhi Join Karen",
      learnMore: "Aur Jaanein",
      getStarted: "Shuru Karen",
      viewAll: "Sabhi Dekhen",
    },
    language: {
      label: "Language",
      english: "English",
      hindi: "हिन्दी",
      urdu: "اردو",
      hinglish: "Hinglish",
    },
  },
}
