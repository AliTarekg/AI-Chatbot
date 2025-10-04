class LanguageUtils {
  constructor() {
    this.arabicKeywordMappings = {
      'أسعار': ['price', 'pricing', 'cost', 'fee', 'rates'],
      'تكلفة': ['cost', 'price', 'expense', 'fee'],
      'سعر': ['price', 'cost', 'pricing'],
      'رسوم': ['fees', 'charges', 'cost', 'price'],
      'مجاني': ['free', 'complimentary', 'no-cost'],
      'دورات': ['course', 'courses', 'training', 'bootcamp', 'program'],
      'دورة': ['course', 'training', 'program'],
      'كورسات': ['course', 'courses', 'training', 'bootcamp'],
      'كورس': ['course', 'training'],
      'تدريب': ['training', 'course', 'courses', 'bootcamp', 'workshop'],
      'برامج': ['program', 'programs', 'courses', 'training'],
      'برنامج': ['program', 'course', 'training'],
      'شهادة': ['certificate', 'certification', 'diploma'],
      'خدمات': ['service', 'services', 'consulting', 'support'],
      'خدمة': ['service', 'consulting'],
      'منتجات': ['product', 'products', 'software', 'solution'],
      'منتج': ['product', 'software'],
      'حلول': ['solution', 'solutions', 'services'],
      'حل': ['solution', 'service'],
      'استشارات': ['consulting', 'consultation', 'advisory'],
      'استشارة': ['consulting', 'consultation'],
      'اتصال': ['contact', 'contacts', 'phone', 'call'],
      'تواصل': ['contact', 'communication', 'reach'],
      'هاتف': ['phone', 'telephone', 'number'],
      'تليفون': ['phone', 'telephone'],
      'رقم': ['number', 'phone'],
      'إيميل': ['email', 'mail', 'contact'],
      'بريد': ['email', 'mail'],
      'عنوان': ['address', 'location', 'office'],
      'موقع': ['location', 'address', 'site', 'office'],
      'مكان': ['location', 'place', 'address'],
      'سياسات': ['policy', 'policies', 'terms', 'conditions'],
      'سياسة': ['policy', 'terms'],
      'قوانين': ['rules', 'policies', 'regulations', 'terms'],
      'قانون': ['rule', 'policy', 'regulation'],
      'شروط': ['terms', 'conditions', 'requirements'],
      'شرط': ['term', 'condition'],
      'أسئلة': ['faq', 'faqs', 'question', 'questions', 'ask'],
      'استفسار': ['inquiry', 'question', 'ask', 'faq'],
      'استفسارات': ['inquiries', 'questions', 'faqs'],
      'سؤال': ['question', 'ask', 'inquiry'],
      'شركة': ['company', 'overview', 'about', 'organization'],
      'مؤسسة': ['company', 'organization', 'institution'],
      'فريق': ['team', 'employees', 'staff', 'personnel'],
      'موظفين': ['employees', 'staff', 'team', 'workers'],
      'موظف': ['employee', 'staff'],
      'وقت': ['time', 'duration', 'schedule'],
      'مدة': ['duration', 'time', 'period'],
      'جدول': ['schedule', 'timetable', 'calendar'],
      'موعد': ['appointment', 'schedule', 'time'],
      'معلومات': ['information', 'details', 'data'],
      'تفاصيل': ['details', 'information', 'specifics'],
      'كيف': ['how', 'method', 'way'],
      'ازاي': ['how', 'method', 'way'],
      'إزاي': ['how', 'method', 'way'],
      'ماذا': ['what', 'which'],
      'ايه': ['what', 'which'],
      'إيه': ['what', 'which'],
      'متى': ['when', 'time', 'schedule'],
      'امتى': ['when', 'time'],
      'إمتى': ['when', 'time'],
      'أين': ['where', 'location', 'place'],
      'فين': ['where', 'location'],
      'عايز': ['want', 'need', 'looking'],
      'عاوز': ['want', 'need', 'looking'],
      'محتاج': ['need', 'want', 'require'],
      'ممكن': ['can', 'possible', 'may'],
      'ازيك': ['how are you', 'greeting', 'hello'],
      'إزيك': ['how are you', 'greeting', 'hello']
    };
    this.arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  }

  isArabic(text) {
    if (!text || typeof text !== 'string') return false;
    return this.arabicRegex.test(text);
  }

  detectLanguage(text) {
    return this.isArabic(text) ? 'ar' : 'en';
  }

  expandArabicKeywords(words) {
    const expandedWords = new Set(words);
    
    for (const word of words) {
      const englishEquivalents = this.arabicKeywordMappings[word];
      if (englishEquivalents) {
        englishEquivalents.forEach(equiv => expandedWords.add(equiv));
      }
    }
    
    return Array.from(expandedWords);
  }

  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/\s+/g, ' ');
  }

  extractKeywords(query) {
    const normalizedQuery = this.normalizeText(query);
    const words = normalizedQuery
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    const expandedWords = this.expandArabicKeywords(words);
    
    return {
      original: words,
      expanded: expandedWords,
      language: this.detectLanguage(query)
    };
  }  getEgyptianToneInstructions() {
    return `استخدم اللهجة المصرية الودية والمهنية:
- التحيات: "ازيك"، "أهلاً وسهلاً"، "إزيك" 
- الأسئلة: "إيه" بدل "ما"، "ازاي" بدل "كيف"، "امتى" بدل "متى"، "فين" بدل "أين"
- الطلبات: "عايز/عاوز" بدل "أريد"، "ممكن" للطلب المهذب
- التعبيرات: "إن شاء الله"، "ربنا يكرمك"، "الحمد لله"
- المخاطبة: "حضرتك" للاحترام، استخدم أسلوب ودود ومهني معاً
- كن واضح ومباشر مع الحفاظ على الود والاحترافية`;
  }
}

module.exports = LanguageUtils;
