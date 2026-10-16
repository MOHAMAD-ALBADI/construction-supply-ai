// Arabic UI dictionary — the only source of user-facing copy (Doc 7 §6).
// Domain terms must follow the glossary in Doc 1 §9.
export const ar = {
  common: {
    syntheticDataBanner:
      "بيانات تجريبية — جميع المنشآت والأسعار والكميات المعروضة افتراضية لأغراض العرض فقط",
    simulated: "محاكاة",
    vatNotice: "الأسعار لا تشمل ضريبة القيمة المضافة (غير محتسبة)",
  },
  home: {
    heading: "{brand}",
    intro:
      "منصة تشغيل ذكية تربط المصانع والموزّعين ومتاجر مواد البناء والمقاولين وملاك المشاريع، من الطلب حتى تأكيد الاستلام.",
    agentsTitle: "ستة وكلاء ذكاء اصطناعي، والقرار التجاري للإنسان",
    agents: {
      needsInventory: "وكيل الاحتياجات والمخزون",
      supplierDiscovery: "وكيل اكتشاف الموردين",
      groupProcurement: "وكيل الشراء الجماعي",
      negotiation: "وكيل التفاوض",
      logistics: "وكيل الخدمات اللوجستية",
      projectIntelligence: "وكيل ذكاء المشاريع",
    },
    status: "قيد البناء — الهيكل الأساسي جاهز",
  },
} as const;

export type Dictionary = typeof ar;
