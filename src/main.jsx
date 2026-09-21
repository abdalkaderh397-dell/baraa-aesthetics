import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Facebook,
  Globe2,
  Instagram,
  Mail,
  MessageCircle,
  MapPin,
  Menu,
  Moon,
  Phone,
  Send,
  Sparkles,
  Sun,
  Syringe,
  UserRound,
  X
} from "lucide-react";

import "./style.css";

const API = "https://baraa-aesthetics-production.up.railway.app/api";
const serviceGroups = [
  {
    titleAr: "إبر النضارة",
    titleEn: "Glow Injections",
    descAr: "جلسات عناية ونضارة تُقدّم وفق تقييم الحالة.",
    descEn:
      "Skin-rejuvenation sessions provided according to case assessment.",
    images: [
      "IMG-20260916-WA0038.jpg",
      "IMG-20260916-WA0048.jpg",
      "IMG-20260916-WA0051.jpg"
    ]
  },
  {
    titleAr: "ميزوثيرابي الوجه",
    titleEn: "Facial Mesotherapy",
    descAr:
      "خيارات للوجه تشمل التفتيح والتصبغات والكلف وآثار الحبوب والمسامات وبهتان البشرة.",
    descEn:
      "Facial options for brightening, pigmentation, melasma, acne marks, pores and dullness.",
    images: [
      "IMG-20260916-WA0032.jpg",
      "IMG-20260916-WA0035.jpg",
      "IMG-20260916-WA0036.jpg",
      "IMG-20260916-WA0040.jpg",
      "IMG-20260916-WA0044.jpg"
    ]
  },
  {
    titleAr: "ميزوثيرابي الشعر",
    titleEn: "Hair Mesotherapy",
    descAr:
      "جلسات موجهة للعناية بالشعر ودعم الكثافة والحيوية والطول وفق تقييم الحالة.",
    descEn:
      "Hair-focused sessions for density and vitality according to case assessment.",
    images: [
      "IMG-20260916-WA0031.jpg",
      "IMG-20260916-WA0033.jpg",
      "IMG-20260916-WA0034.jpg",
      "IMG-20260916-WA0043.jpg",
      "IMG-20260916-WA0049.jpg"
    ]
  },
  {
    titleAr: "علاج ترهل الوجه",
    titleEn: "Facial Laxity Care",
    descAr: "خطة عناية غير جراحية تُحدد بما يناسب الحالة.",
    descEn:
      "A non-surgical care plan selected according to the individual case."
  },
  {
    titleAr: "البلازما PRP",
    titleEn: "PRP Plasma",
    descAr:
      "بلازما للوجه والشعر وتفتيح اليدين ضمن خطة يحددها المختص.",
    descEn:
      "PRP options for face, hair and hand brightening according to assessment.",
    images: [
      "IMG-20260916-WA0045.jpg",
      "IMG-20260916-WA0047.jpg"
    ]
  },
  {
    titleAr: "العناية والتجديد",
    titleEn: "Care & Renewal",
    descAr:
      "جلسات عناية وتجديد للبشرة ضمن برنامج مناسب للحالة.",
    descEn:
      "Skin-care and renewal sessions tailored to the case.",
    images: [
      "IMG-20260916-WA0046.jpg"
    ]
  },
  {
    titleAr: "الهالات حول العينين",
    titleEn: "Under-Eye Care",
    descAr:
      "جلسات مخصصة لمنطقة محيط العين بعد تقييم الحالة.",
    descEn:
      "Targeted under-eye sessions following case assessment.",
    images: [
      "IMG-20260916-WA0050.jpg"
    ]
  },
  {
    titleAr: "البوتوكس",
    titleEn: "Botox",
    descAr:
      "لتخفيف مظهر تجاعيد الوجه وفق تقييم المختص.",
    descEn:
      "For reducing the appearance of facial lines following professional assessment.",
    images: [
      "IMG-20260916-WA0037.jpg",
      "IMG-20260916-WA0042.jpg",
      "IMG-20260916-WA0054.jpg"
    ]
  }
];

const mesoItems = [
  "التفتيح",
  "علاج التصبغات",
  "علاج الكلف",
  "علاج آثار الحبوب",
  "علاج المسامات الواسعة",
  "علاج بهتان البشرة",
  "تذويب اللغلوغ"
];

function App() {
  const [lang, setLang] = useState("ar");
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);

  const [form, setForm] = useState({
    service: "",
    date: "",
    time: "",
    name: "",
    phone: "",
    notes: ""
  });

  const [message, setMessage] = useState("");
  const [bookingSummary, setBookingSummary] = useState(null);
  const [available, setAvailable] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // إعدادات الدوام القادمة من قاعدة البيانات
  const [settings, setSettings] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // ================================
  // حجوزاتي
  // ================================
  const [myPhone, setMyPhone] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);
  const [myBookingsMessage, setMyBookingsMessage] = useState("");
  const [cancellationBooking, setCancellationBooking] = useState(null);
  const [cancellationNote, setCancellationNote] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState(false);

  const ar = lang === "ar";

  const t = (a, e) => (ar ? a : e);

  /*
    إعداد اللغة واتجاه الصفحة
  */
  useEffect(() => {
    document.documentElement.lang =
      lang === "ar" ? "ar" : "en";

    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  /*
    تحميل إعدادات الدوام من السيرفر
  */
  useEffect(() => {
    setLoadingSettings(true);

    fetch(API + "/settings")
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to load settings");
        }

        return r.json();
      })
      .then((data) => {
        setSettings(
          Array.isArray(data) ? data : []
        );
      })
      .catch((err) => {
        console.error("SETTINGS ERROR:", err);
        setSettings([]);
      })
      .finally(() => {
        setLoadingSettings(false);
      });
  }, []);

  /*
    تحويل وقت مثل 09:00:00 إلى 09:00
  */
  const normalizeTime = (time) => {
    if (!time) {
      return "";
    }

    return String(time).slice(0, 5);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = normalizeTime(time)
      .split(":")
      .map(Number);

    return Number.isFinite(hours) && Number.isFinite(minutes)
      ? hours * 60 + minutes
      : NaN;
  };

  const dayOfWeekFromDate = (value) => {
    const [year, month, day] = String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);

    if (![year, month, day].every(Number.isFinite)) {
      return NaN;
    }

    let adjustedYear = year;
    let adjustedMonth = month;

    if (adjustedMonth < 3) {
      adjustedYear -= 1;
      adjustedMonth += 12;
    }

    return (
      adjustedYear +
      Math.floor(adjustedYear / 4) -
      Math.floor(adjustedYear / 100) +
      Math.floor(adjustedYear / 400) +
      Math.floor((13 * adjustedMonth + 8) / 5) +
      day
    ) % 7;
  };

  const isClosedPeriodSlot = (slot, periods = []) => {
    const minutes = timeToMinutes(slot);

    return periods.some((period) => {
      const start = timeToMinutes(period.start_time);
      const end = timeToMinutes(period.end_time);

      return minutes >= start && minutes < end;
    });
  };

  /*
    إنشاء الساعات المتاحة حسب ساعات دوام اليوم

    مثال:
    10:00 → 12:00

    النتيجة:
    10:00
    11:00
  */
  const generateWorkingSlots = (
    startTime,
    endTime
  ) => {
    const slots = [];

    if (!startTime || !endTime) {
      return slots;
    }

    const startParts = normalizeTime(startTime)
      .split(":")
      .map(Number);

    const endParts = normalizeTime(endTime)
      .split(":")
      .map(Number);

    if (
      startParts.length !== 2 ||
      endParts.length !== 2 ||
      startParts.some(Number.isNaN) ||
      endParts.some(Number.isNaN)
    ) {
      return slots;
    }

    let startMinutes =
      startParts[0] * 60 +
      startParts[1];

    const endMinutes =
      endParts[0] * 60 +
      endParts[1];

    while (startMinutes < endMinutes) {
      const hour = Math.floor(
        startMinutes / 60
      );

      const minute = startMinutes % 60;

      slots.push(
        String(hour).padStart(2, "0") +
          ":" +
          String(minute).padStart(2, "0")
      );

      // مدة الموعد ساعة واحدة
      startMinutes += 60;
    }

    return slots;
  };

  /*
    تحديد ساعات الحجز حسب التاريخ المختار
  */
  useEffect(() => {
    if (!form.date) {
      setAvailable([]);
      return;
    }

    if (loadingSettings) {
      setAvailable([]);
      return;
    }

    setLoadingSlots(true);

    const dayOfWeek = dayOfWeekFromDate(form.date);

    if (dayOfWeek === 5) {
      setAvailable([]);
      setLoadingSlots(false);
      return;
    }

    const daySettings = settings.find(
      (s) =>
        Number(s.day_of_week) ===
        dayOfWeek
    );

    /*
      إذا لم نجد إعدادات لهذا اليوم
    */
    if (!daySettings) {
      setAvailable([]);
      setLoadingSlots(false);
      return;
    }

    /*
      إذا كان اليوم مغلقًا
    */
    if (!Number(daySettings.is_open)) {
      setAvailable([]);
      setLoadingSlots(false);
      return;
    }

    /*
      إنشاء ساعات الدوام من إعدادات الإدارة
    */
    const workingSlots =
      generateWorkingSlots(
        daySettings.start_time,
        daySettings.end_time
      );

    const openSlots = workingSlots.filter(
      (slot) =>
        !isClosedPeriodSlot(
          slot,
          daySettings.closed_periods || []
        )
    );

    if (!openSlots.length) {
      setAvailable([]);
      setLoadingSlots(false);
      return;
    }

    /*
      جلب الساعات المحجوزة/المتاحة من السيرفر
    */
    fetch(
      API +
        "/availability?date=" +
        encodeURIComponent(form.date)
    )
      .then((r) => {
        if (!r.ok) {
          return r
            .json()
            .catch(() => ({}))
            .then((data) => {
              throw new Error(
                data.message ||
                  "Availability error"
              );
            });
        }

        return r.json();
      })
      .then((data) => {
        const serverAvailable =
          Array.isArray(data.available)
            ? data.available.map(
                normalizeTime
              )
            : null;

        /*
          إذا أعاد السيرفر قائمة available
          نلتزم بها ونضمن أنها ضمن ساعات الدوام.
        */
        if (Array.isArray(serverAvailable)) {
          const filtered =
            openSlots.filter(
              (slot) =>
                serverAvailable.includes(
                  slot
                )
            );

          setAvailable(filtered);
        } else {
          /*
            إذا لم يعُد السيرفر قائمة available
            نستخدم ساعات الدوام.
          */
            setAvailable(openSlots);
        }
      })
      .catch((err) => {
        console.error(
          "AVAILABILITY ERROR:",
          err
        );

        /*
          لا نعرض ساعات غير مؤكدة عند حدوث خطأ.
        */
        setAvailable([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [
    form.date,
    settings,
    loadingSettings
  ]);

  /*
    القائمة الرئيسية
  */
  const nav = [
    [
      "home",
      t("الرئيسية", "Home")
    ],
    [
      "about",
      t("عن براءة", "About")
    ],
    [
      "clinic",
      t("العيادة", "Clinic")
    ],
    [
      "services",
      t("الخدمات", "Services")
    ],
    [
      "gallery",
      t("المعرض", "Gallery")
    ],
    [
      "booking",
      t("الحجز", "Booking")
    ],
    [
      "my-bookings",
      t("حجوزاتي", "My Bookings")
    ],
    [
      "contact",
      t("التواصل", "Contact")
    ]
  ];

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth"
      });

    setMenu(false);
  };

  /*
    إرسال طلب الحجز
  */
  const submitBooking = async (e) => {
    e.preventDefault();

    setMessage("");
    setBookingSummary(null);

    if (form.date && dayOfWeekFromDate(form.date) === 5) {
      setMessage(
        t(
          "الجمعة عطلة أسبوعية للعيادة.",
          "Friday is the clinic's weekly day off."
        )
      );
      return;
    }

    console.log(
      "BOOKING FORM:",
      form
    );

    try {
      const res = await fetch(
        API + "/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Booking error"
        );
      }

      const nextStatus =
        getBookingStatus("pending");

      setBookingSummary({
        id: data.id,
        service: form.service,
        date: form.date,
        time: form.time,
        status: nextStatus
      });

      setMessage(
        t(
          "تم إنشاء الحجز بنجاح. رقم الحجز الخاص بك هو #" + data.id + ". سيبقى قيد المراجعة حتى موافقة الإدارة.",
          "Your booking was created successfully. Your booking number is #" + data.id + ". It remains pending until approved by the admin."
        )
      );

      /*
        بعد نجاح الحجز نمسح الحقول
      */
      setForm({
        service: "",
        date: "",
        time: "",
        name: "",
        phone: "",
        notes: ""
      });
    } catch (err) {
      setMessage(
        err.message ||
          t(
            "تعذر إرسال الحجز حالياً. تأكد من تشغيل الخادم.",
            "The booking could not be sent. Make sure the server is running."
          )
      );
    }
  };

  /*
    تحويل حالة الحجز إلى نص مفهوم
  */
  const getBookingStatus = (
    status
  ) => {
    if (status === "approved") {
      return {
        text: t(
          "تم تأكيد الحجز",
          "Booking confirmed"
        ),
        icon: "🟢",
        background:
          "rgba(76, 153, 98, .14)",
        color: "#2f7a52"
      };
    }

    if (status === "rejected") {
      return {
        text: t(
          "تم رفض الحجز",
          "Booking rejected"
        ),
        icon: "🔴",
        background:
          "rgba(181, 82, 76, .14)",
        color: "#a8453d"
      };
    }

    if (status === "cancelled") {
      return {
        text: t(
          "أُلغي من قبلكِ",
          "Cancelled by you"
        ),
        icon: "⚫",
        background:
          "rgba(48, 51, 49, .14)",
        color: "var(--charcoal)"
      };
    }

    return {
      text: t(
        "قيد المراجعة",
        "Pending review"
      ),
      icon: "🟡",
      background:
        "rgba(228, 174, 86, .16)",
      color: "#9b6f1c"
    };
  };

  /*
    تاريخ الحجز قيمة تاريخ فقط، لذلك لا نحوله إلى كائن Date.
  */
  const formatBookingDate = (
    value
  ) => {
    return value ? String(value).slice(0, 10) : "";
  };

  /*
    جلب حجوزات المراجع بواسطة رقم الهاتف
  */
  const loadMyBookings = async (
    e
  ) => {
    e?.preventDefault();

    const phone =
      myPhone.trim();

    setMyBookingsMessage("");

    if (!phone) {
      setMyBookings([]);

      setMyBookingsMessage(
        t(
          "يرجى إدخال رقم الهاتف.",
          "Please enter your phone number."
        )
      );

      return;
    }

    setLoadingMyBookings(true);

    try {
      const res = await fetch(
        API +
          "/my-bookings?phone=" +
          encodeURIComponent(phone)
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            t(
              "تعذر جلب الحجوزات.",
              "Could not load bookings."
            )
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          t(
            "البيانات المستلمة غير صحيحة.",
            "Invalid booking data received."
          )
        );
      }

      setMyBookings(data);

      if (data.length === 0) {
        setMyBookingsMessage(
          t(
            "لم نجد أي حجوزات مرتبطة بهذا الرقم.",
            "No bookings were found for this phone number."
          )
        );
      }
    } catch (err) {
      console.error(
        "MY BOOKINGS ERROR:",
        err
      );

      setMyBookings([]);

      setMyBookingsMessage(
        err.message ||
          t(
            "تعذر جلب الحجوزات حالياً. تأكدي من تشغيل الخادم.",
            "Could not load bookings. Make sure the server is running."
          )
      );
    } finally {
      setLoadingMyBookings(false);
    }
  };

  /*
    مسح نتائج حجوزاتي
  */
  const clearMyBookings = () => {
    setMyPhone("");
    setMyBookings([]);
    setMyBookingsMessage("");
  };

  const openCancellation = (booking) => {
    setCancellationBooking(booking);
    setCancellationNote("");
  };

  const closeCancellation = () => {
    if (cancellingBooking) {
      return;
    }

    setCancellationBooking(null);
    setCancellationNote("");
  };

  const confirmCancellation = async () => {
    if (!cancellationBooking) {
      return;
    }

    setCancellingBooking(true);

    try {
      const res = await fetch(
        API + "/my-bookings/" + cancellationBooking.id + "/cancel",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone: myPhone.trim(),
            cancellationNote
          })
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            t("تعذر إلغاء الحجز.", "Could not cancel the booking.")
        );
      }

      setCancellationBooking(null);
      setCancellationNote("");
      setMyBookingsMessage(
        t(
          "تم إلغاء الحجز وحفظ بياناته.",
          "The booking was cancelled and its data was preserved."
        )
      );
      await loadMyBookings();
    } catch (err) {
      setMyBookingsMessage(err.message);
    } finally {
      setCancellingBooking(false);
    }
  };

  return (
    <div
      className={
        dark
          ? "app dark"
          : "app"
      }
    >
      <header className="header">
        <div className="container navWrap">
          <button
            className="brand"
            onClick={() =>
              scrollTo("home")
            }
          >
            <span className="brandMark">
              BA
            </span>

            <span>
              <b>Baraa</b>
              <small>
                Aesthetics
              </small>
            </span>
          </button>

          <nav
            className={
              menu
                ? "nav open"
                : "nav"
            }
          >
            {nav.map(
              ([id, label]) => (
                <button
                  key={id}
                  onClick={() =>
                    scrollTo(id)
                  }
                >
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="tools">
            <button
              aria-label="language"
              onClick={() =>
                setLang(
                  ar ? "en" : "ar"
                )
              }
            >
              <Globe2 size={18} />
              {ar ? "EN" : "AR"}
            </button>

            <button
              aria-label="theme"
              onClick={() =>
                setDark(
                  (v) => !v
                )
              }
            >
              {dark ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            <button
              className="menuBtn"
              onClick={() =>
                setMenu(
                  (v) => !v
                )
              }
            >
              {menu ? (
                <X />
              ) : (
                <Menu />
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ================================
            HOME
        ================================= */}
        <section
          id="home"
          className="hero"
        >
          <div className="container heroGrid">
            <div className="heroCopy">
              <span className="eyebrow">
                <Sparkles size={16} />

                {t(
                  "تجميل غير جراحي • عناية مهنية",
                  "Non-surgical aesthetics • Professional care"
                )}
              </span>

              <h1>
                {t(
                  "جمالك يبدأ بعناية مهنية",
                  "Your beauty begins with professional care"
                )}
              </h1>

              <p>
                {t(
                  "عيادة براءة للتجميل غير الجراحي في الرقة، بتجربة هادئة وهوية طبية أنيقة، مع خدمات مصممة وفق تقييم كل حالة.",
                  "Baraa Aesthetics in Al-Raqqa, offering a calm clinical experience and carefully selected non-surgical aesthetic services."
                )}
              </p>

              <div className="heroActions">
                <button
                  className="btn primary"
                  onClick={() =>
                    scrollTo("booking")
                  }
                >
                  {t(
                    "احجزي موعدك",
                    "Book an appointment"
                  )}

                  <ArrowLeft
                    size={18}
                  />
                </button>

                <button
                  className="btn ghost"
                  onClick={() =>
                    scrollTo(
                      "services"
                    )
                  }
                >
                  {t(
                    "استكشفي الخدمات",
                    "Explore services"
                  )}
                </button>
              </div>

              <div className="heroStats">
                <div>
                  <b>2026</b>

                  <span>
                    {t(
                      "تخرج صيدلة",
                      "Pharmacy graduate"
                    )}
                  </span>
                </div>

                <div>
                  <b>80%</b>

                  <span>
                    {t(
                      "المعدل الجامعي",
                      "University GPA"
                    )}
                  </span>
                </div>

                <div>
                  <b>PRP</b>

                  <span>
                    {t(
                      "عناية متخصصة",
                      "Specialized care"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="heroVisual">
              <div className="orb"></div>

              <div className="heroCard">
                <span className="logoBig">
                  BA
                </span>

                <h3>
                  Baraa Aesthetics
                </h3>

                <p>
                  {t(
                    "براءة للتجميل غير الجراحي",
                    "Non-surgical aesthetics"
                  )}
                </p>

                <div className="locationPill">
                  <MapPin
                    size={15}
                  />

                  {t(
                    "الرقة • المنصورة • شارع الأطباء",
                    "Al-Raqqa • Al-Mansoura • Doctors Street"
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================
            ABOUT
        ================================= */}
        <section
          id="about"
          className="section"
        >
          <div className="container twoCol">
            <div>
              <span className="sectionTag">
                {t(
                  "عن براءة",
                  "About Baraa"
                )}
              </span>

              <h2>
                {t(
                  "صيدلانية تجمع بين المعرفة والعناية الجمالية",
                  "A pharmacist combining knowledge with aesthetic care"
                )}
              </h2>

              <p>
                {t(
                  "براءة عزيز الحميدي خريجة صيدلة من جامعة الحواش الخاصة لعام 2026 بمعدل 80%. لديها تدريب صيدلاني، ودورات في المواد التجميلية وصناعة المستحضرات والتجميل غير الجراحي، وتسعى لتقديم تجربة منظمة وهادئة للزوار.",
                  "Baraa Aziz Al-Humaidy is a 2026 pharmacy graduate from Al-Hawash Private University with an 80% GPA. Her training and courses include cosmetic materials, formulation and non-surgical aesthetics."
                )}
              </p>

              <div className="facts">
                <div>
                  <b>2026</b>

                  <span>
                    {t(
                      "التخرج",
                      "Graduation"
                    )}
                  </span>
                </div>

                <div>
                  <b>80%</b>

                  <span>
                    {t(
                      "المعدل",
                      "GPA"
                    )}
                  </span>
                </div>

                <div>
                  <b>1</b>

                  <span>
                    {t(
                      "شهر تدريب صيدلاني",
                      "Month pharmacy training"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="quoteCard">
              <Syringe size={32} />

              <h3>
                {t(
                  "العناية تبدأ بالتقييم",
                  "Care starts with assessment"
                )}
              </h3>

              <p>
                {t(
                  "كل خدمة تُناقش بما يتناسب مع الحالة، مع الاهتمام بالتفاصيل والخصوصية وتجربة المراجعة.",
                  "Each service is discussed according to the case, with attention to details, privacy and the client experience."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ================================
            CLINIC
        ================================= */}
        <section
          id="clinic"
          className="section soft"
        >
          <div className="container">
            <div className="sectionHead">
              <span className="sectionTag">
                {t(
                  "العيادة",
                  "The Clinic"
                )}
              </span>

              <h2>
                {t(
                  "هوية هادئة، تجربة واضحة",
                  "Calm identity, clear experience"
                )}
              </h2>
            </div>

            <div className="clinicGrid">
              <div className="clinicCard">
                <Sparkles />

                <h3>
                  {t(
                    "أجواء أنيقة",
                    "Elegant atmosphere"
                  )}
                </h3>

                <p>
                  {t(
                    "تصميم بصري هادئ يجمع بين الطابع الطبي واللمسة الجمالية.",
                    "A calm visual identity blending clinical and aesthetic character."
                  )}
                </p>
              </div>

              <div className="clinicCard">
                <UserRound />

                <h3>
                  {t(
                    "اهتمام بالحالة",
                    "Case-focused care"
                  )}
                </h3>

                <p>
                  {t(
                    "الخدمات تُعرض كخيارات للعناية بعد تقييم الحالة ومناقشة ما يناسبها.",
                    "Services are presented as care options after assessment and discussion."
                  )}
                </p>
              </div>

              <div className="clinicCard">
                <CalendarDays />

                <h3>
                  {t(
                    "حجز منظم",
                    "Organized booking"
                  )}
                </h3>

                <p>
                  {t(
                    "طلب حجز إلكتروني ومراجعة من الإدارة قبل تثبيت الموعد.",
                    "Online booking request reviewed by the admin before confirmation."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================
            SERVICES
        ================================= */}
        <section
          id="services"
          className="section"
        >
          <div className="container">
            <div className="sectionHead">
              <span className="sectionTag">
                {t(
                  "الخدمات",
                  "Services"
                )}
              </span>

              <h2>
                {t(
                  "خيارات التجميل غير الجراحي",
                  "Non-surgical aesthetic options"
                )}
              </h2>

              <p>
                {t(
                  "جميع الخدمات تُقدّم وفق تقييم الحالة، دون وعود بنتائج محددة.",
                  "Services are provided according to case assessment, without guarantees of specific outcomes."
                )}
              </p>
            </div>

            <div className="serviceGrid">
              {serviceGroups.map(
                (s, i) => (
                  <article
                    className="serviceCard"
                    key={s.titleAr}
                  >
                    <span className="serviceNo">
                      0{i + 1}
                    </span>

                    <Syringe
                      size={23}
                    />

                    {s.images?.length > 0 && (
                      <div className="serviceImages">
                        {s.images.map((image) => (
                          <img
                            key={image}
                            src={`/images/services/${image}`}
                            alt={ar ? s.titleAr : s.titleEn}
                          />
                        ))}
                      </div>
                    )}

                    <h3>
                      {ar
                        ? s.titleAr
                        : s.titleEn}
                    </h3>

                    <p>
                      {ar
                        ? s.descAr
                        : s.descEn}
                    </p>

                    {i === 1 && (
                      <div className="miniList">
                        {mesoItems.map(
                          (x) => (
                            <span
                              key={x}
                            >
                              •{" "}
                              {ar
                                ? x
                                : x
                                    .replace(
                                      "التفتيح",
                                      "Brightening"
                                    )
                                    .replace(
                                      "علاج التصبغات",
                                      "Pigmentation"
                                    )
                                    .replace(
                                      "علاج الكلف",
                                      "Melasma"
                                    )
                                    .replace(
                                      "علاج آثار الحبوب",
                                      "Acne marks"
                                    )
                                    .replace(
                                      "علاج المسامات الواسعة",
                                      "Large pores"
                                    )
                                    .replace(
                                      "علاج بهتان البشرة",
                                      "Dullness"
                                    )
                                    .replace(
                                      "تذويب اللغلوغ",
                                      "Submental area care"
                                    )}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setForm(
                          (f) => ({
                            ...f,
                            service:
                              ar
                                ? s.titleAr
                                : s.titleEn
                          })
                        );

                        scrollTo(
                          "booking"
                        );
                      }}
                    >
                      {t(
                        "اختيار الخدمة",
                        "Select service"
                      )}

                      {ar ? (
                        <ArrowLeft
                          size={16}
                        />
                      ) : (
                        <ArrowRight
                          size={16}
                        />
                      )}
                    </button>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* ================================
            EXPERIENCE
        ================================= */}
        <section className="section highlight">
          <div className="container highlightGrid">
            <div>
              <span className="sectionTag">
                {t(
                  "الخبرة والدورات",
                  "Experience & Courses"
                )}
              </span>

              <h2>
                {t(
                  "مسار مهني يجمع الصيدلة والتجميل",
                  "A path combining pharmacy and aesthetics"
                )}
              </h2>
            </div>

            <div className="timeline">
              <div>
                <b>2026</b>

                <span>
                  {t(
                    "إجازة في الصيدلة — جامعة الحواش الخاصة",
                    "Pharmacy degree — Al-Hawash Private University"
                  )}
                </span>
              </div>

              <div>
                <b>01</b>

                <span>
                  {t(
                    "شهر تدريب في صيدلية الحميدي",
                    "One-month training at Al-Humaidy Pharmacy"
                  )}
                </span>
              </div>

              <div>
                <b>ATTC</b>

                <span>
                  {t(
                    "اللغة الإنكليزية — مستوى 5 Intermediate",
                    "English — Level 5 Intermediate"
                  )}
                </span>
              </div>

              <div>
                <b>PR</b>

                <span>
                  {t(
                    "دورة التجميل غير الجراحي مع د. زينة المجبر في حمص",
                    "Non-surgical aesthetics course with Dr. Zeina Al-Majbar in Homs"
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================
            GALLERY
        ================================= */}
        <section
          id="gallery"
          className="section"
        >
          <div className="container">
            <div className="sectionHead">
              <span className="sectionTag">
                {t(
                  "المعرض",
                  "Gallery"
                )}
              </span>

              <h2>
                {t(
                  "لمحات من عالم العناية",
                  "A glimpse into our care"
                )}
              </h2>
            </div>
<div className="galleryGrid">
  {[
    "IMG-20260916-WA0039.jpg",
    "IMG-20260916-WA0041.jpg",
    "IMG-20260916-WA0052.jpg",
    "IMG-20260916-WA0053.jpg",
    "IMG-20260916-WA0077.jpg",
    "IMG-20260916-WA0078.jpg"
  ].map((x) => (
                <div
                  className="galleryItem"
                  key={x}
                >
                  <img
                    src={`/images/gallery/${x}`}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                    alt=""
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================
            BOOKING
        ================================= */}
        <section
          id="booking"
          className="section soft"
        >
          <div className="container bookingGrid">
            <div>
              <span className="sectionTag">
                {t(
                  "الحجز",
                  "Booking"
                )}
              </span>

              <h2>
                {t(
                  "اطلبي موعدك",
                  "Request an appointment"
                )}
              </h2>

              <p>
                {t(
                  "أوقات الحجز تعتمد الآن مباشرة على جدول الدوام الذي تحدده الإدارة من لوحة التحكم.",
                  "Booking times now depend directly on the working schedule configured by the admin."
                )}
              </p>

              <div className="infoBox">
                <Clock3 />

                <span>
                  {t(
                    "كل موعد مدته ساعة تقريباً",
                    "Each appointment is approximately one hour"
                  )}
                </span>
              </div>

              <div className="infoBox">
                <Check />

                <span>
                  {t(
                    "الطلب يبقى قيد المراجعة حتى موافقة الإدارة",
                    "The request remains pending until admin approval"
                  )}
                </span>
              </div>
            </div>

            <form
              className="bookingForm"
              onSubmit={
                submitBooking
              }
            >
              <label>
                {t(
                  "الخدمة",
                  "Service"
                )}

                <select
                  required
                  value={
                    form.service
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      service:
                        e.target.value
                    })
                  }
                >
                  <option value="">
                    {t(
                      "اختاري الخدمة",
                      "Choose a service"
                    )}
                  </option>

                  {serviceGroups.map(
                    (s) => (
                      <option
                        key={
                          s.titleAr
                        }
                        value={
                          ar
                            ? s.titleAr
                            : s.titleEn
                        }
                      >
                        {ar
                          ? s.titleAr
                          : s.titleEn}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="formRow">
                <label>
                  {t(
                    "التاريخ",
                    "Date"
                  )}

                  <input
                    type="date"
                    required
                   min={new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Damascus"
}).format(new Date())}
                    value={
                      form.date
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date:
                          e.target
                            .value,
                        time: ""
                      })
                    }
                  />
                </label>

                <label>
                  {t(
                    "الوقت",
                    "Time"
                  )}

                  <select
                    required
                    value={
                      form.time
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        time:
                          e.target
                            .value
                      })
                    }
                  >
                    <option value="">
                      {loadingSettings ||
                      loadingSlots
                        ? t(
                            "جاري التحقق...",
                            "Checking..."
                          )
                        : t(
                            "اختاري الوقت",
                            "Choose time"
                          )}
                    </option>

                    {available.map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              {form.date &&
                !loadingSettings &&
                !loadingSlots &&
                available.length ===
                  0 && (
                  <div className="formMessage">
                    {t(
                      dayOfWeekFromDate(form.date) === 5
                        ? "الجمعة عطلة أسبوعية للعيادة."
                        : "لا توجد مواعيد متاحة في هذا اليوم.",
                      dayOfWeekFromDate(form.date) === 5
                        ? "Friday is the clinic's weekly day off."
                        : "There are no available appointments on this day."
                    )}
                  </div>
                )}

              <label>
                {t(
                  "الاسم",
                  "Name"
                )}

                <input
                  required
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target
                          .value
                    })
                  }
                  placeholder={t(
                    "الاسم الكامل",
                    "Full name"
                  )}
                />
              </label>

              <label>
                {t(
                  "رقم الهاتف",
                  "Phone"
                )}

                <input
                  required
                  value={
                    form.phone
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target
                          .value
                    })
                  }
                  placeholder="09xxxxxxxx"
                />
              </label>

              <label>
                {t(
                  "ملاحظات اختيارية",
                  "Optional notes"
                )}

                <textarea
                  rows="4"
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target
                          .value
                    })
                  }
                />
              </label>

              <button
                className="btn primary"
                type="submit"
                disabled={
                  loadingSettings ||
                  loadingSlots ||
                  !available.length
                }
              >
                <Send size={17} />

                {t(
                  "إرسال طلب الحجز",
                  "Send booking request"
                )}
              </button>

              {message && (
                <div className="formMessage">
                  {message}
                </div>
              )}

              {bookingSummary && (
                <div
                  style={{
                    marginTop: "18px",
                    border: "1px solid rgba(246, 144, 166, .25)",
                    borderRadius: "16px",
                    background: "rgba(246, 144, 166, .08)",
                    padding: "20px",
                    display: "grid",
                    gap: "14px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap"
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "15px",
                        color: "var(--ink)"
                      }}
                    >
                      {t(
                        "تفاصيل الحجز",
                        "Booking details"
                      )}
                    </strong>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        background:
                          bookingSummary.status.background,
                        color:
                          bookingSummary.status.color,
                        fontSize: "11px",
                        fontWeight: "700",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {bookingSummary.status.icon}{" "}
                      {bookingSummary.status.text}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      color: "var(--ink)"
                    }}
                  >
                    <div>
                      <small
                        style={{
                          display: "block",
                          color: "var(--muted)",
                          marginBottom: "4px"
                        }}
                      >
                        {t(
                          "رقم الحجز",
                          "Booking number"
                        )}
                      </small>

                      <strong>
                        B{bookingSummary.id}
                      </strong>
                    </div>

                    <div>
                      <small
                        style={{
                          display: "block",
                          color: "var(--muted)",
                          marginBottom: "4px"
                        }}
                      >
                        {t(
                          "الخدمة",
                          "Service"
                        )}
                      </small>

                      <strong>
                        {bookingSummary.service}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px"
                      }}
                    >
                      <div>
                        <small
                          style={{
                            display: "block",
                            color: "var(--muted)",
                            marginBottom: "4px"
                          }}
                        >
                          {t(
                            "التاريخ",
                            "Date"
                          )}
                        </small>

                        <strong>
                          {formatBookingDate(
                            bookingSummary.date
                          )}
                        </strong>
                      </div>

                      <div>
                        <small
                          style={{
                            display: "block",
                            color: "var(--muted)",
                            marginBottom: "4px"
                          }}
                        >
                          {t(
                            "الوقت",
                            "Time"
                          )}
                        </small>

                        <strong>
                          {normalizeTime(
                            bookingSummary.time
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* ================================
            MY BOOKINGS
        ================================= */}
        <section
          id="my-bookings"
          className="section"
        >
          <div className="container">
            <div className="sectionHead">
              <span className="sectionTag">
                <CalendarDays
                  size={16}
                />

                {t(
                  "حجوزاتي",
                  "My Bookings"
                )}
              </span>

              <h2>
                {t(
                  "تابعي حجوزاتك بسهولة",
                  "Track your bookings easily"
                )}
              </h2>

              <p>
                {t(
                  "أدخلي رقم الهاتف المستخدم عند الحجز لمعرفة جميع طلبات الحجز وحالتها.",
                  "Enter the phone number used when booking to view your requests and their current status."
                )}
              </p>
            </div>

            <form
              className="bookingForm"
              onSubmit={
                loadMyBookings
              }
            >
              <label>
                {t(
                  "رقم الهاتف",
                  "Phone number"
                )}

                <input
                  type="tel"
                  value={myPhone}
                  onChange={(e) => {
                    setMyPhone(
                      e.target.value
                    );

                    setMyBookings(
                      []
                    );

                    setMyBookingsMessage(
                      ""
                    );
                  }}
                  placeholder="09xxxxxxxx"
                  autoComplete="tel"
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap"
                }}
              >
                <button
                  className="btn primary"
                  type="submit"
                  disabled={
                    loadingMyBookings
                  }
                >
                  <Phone
                    size={17}
                  />

                  {loadingMyBookings
                    ? t(
                        "جاري البحث...",
                        "Searching..."
                      )
                    : t(
                        "عرض حجوزاتي",
                        "View my bookings"
                      )}
                </button>

                {(myBookings.length >
                  0 ||
                  myPhone) && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={
                      clearMyBookings
                    }
                  >
                    <X size={17} />

                    {t(
                      "مسح",
                      "Clear"
                    )}
                  </button>
                )}
              </div>

              {myBookingsMessage && (
                <div className="formMessage">
                  {myBookingsMessage}
                </div>
              )}
            </form>

            {myBookings.length >
              0 && (
              <div
                style={{
                  marginTop:
                    "30px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "18px"
                }}
              >
                {myBookings.map(
                  (booking) => {
                    const status =
                      getBookingStatus(
                        booking.status
                      );

                    return (
                      <article
                        key={
                          booking.id
                        }
                        className="clinicCard"
                        style={{
                          position:
                            "relative",
                          overflow:
                            "hidden"
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            marginBottom:
                              "18px"
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "9px"
                            }}
                          >
                            <Syringe
                              size={
                                22
                              }
                            />

                            <strong>
                              {booking.service ||
                                t(
                                  "خدمة تجميل",
                                  "Aesthetic service"
                                )}
                            </strong>
                          </div>

                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "5px",
                              padding:
                                "7px 10px",
                              borderRadius:
                                "999px",
                              background:
                                status.background,
                              color:
                                status.color,
                              fontSize:
                                "11px",
                              fontWeight:
                                "700",
                              whiteSpace:
                                "nowrap"
                            }}
                          >
                            {status.icon}{" "}
                            {
                              status.text
                            }
                          </span>
                        </div>

                        <div
                          style={{
                            display:
                              "grid",
                            gap: "12px"
                          }}
                        >
                          <div className="infoBox">
                            <CalendarDays
                              size={
                                18
                              }
                            />

                            <span>
                              <strong>
                                {t(
                                  "التاريخ:",
                                  "Date:"
                                )}{" "}
                              </strong>

                              {formatBookingDate(
                                booking.booking_date
                              )}
                            </span>
                          </div>

                          <div className="infoBox">
                            <Clock3
                              size={
                                18
                              }
                            />

                            <span>
                              <strong>
                                {t(
                                  "الوقت:",
                                  "Time:"
                                )}{" "}
                              </strong>

                              {normalizeTime(
                                booking.booking_time
                              )}
                            </span>
                          </div>

                          <div className="infoBox">
                            <UserRound
                              size={
                                18
                              }
                            />

                            <span>
                              <strong>
                                {t(
                                  "الاسم:",
                                  "Name:"
                                )}{" "}
                              </strong>

                              {
                                booking.name
                              }
                            </span>
                          </div>

                          {booking.notes && (
                            <div className="infoBox">
                              <Mail
                                size={
                                  18
                                }
                              />

                              <span>
                                <strong>
                                  {t(
                                    "ملاحظات:",
                                    "Notes:"
                                  )}{" "}
                                </strong>

                                {
                                  booking.notes
                                }
                              </span>
                            </div>
                          )}

                          {booking.status === "cancelled" && (
                            <div className="infoBox">
                              <X size={18} />
                              <span>
                                <strong>
                                  {t("ملاحظة الإلغاء:", "Cancellation note:")} {" "}
                                </strong>
                                {booking.cancellation_note || t("لا توجد ملاحظة", "No note")}
                              </span>
                            </div>
                          )}
                        </div>

                        {(booking.status === "pending" || booking.status === "approved") && (
                          <button
                            type="button"
                            className="btn ghost"
                            style={{
                              marginTop: "18px",
                              color: "#a8453d",
                              borderColor: "rgba(168, 69, 61, .3)"
                            }}
                            onClick={() => openCancellation(booking)}
                          >
                            <X size={17} />
                            {t("إلغاء الحجز", "Cancel booking")}
                          </button>
                        )}

                        <div
                          style={{
                            marginTop:
                              "18px",
                            paddingTop:
                              "14px",
                            borderTop:
                              "1px solid var(--line)",
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            fontSize:
                              "11px",
                            color:
                              "var(--muted)"
                          }}
                        >
                          <span>
                            {t(
                              "رقم الحجز",
                              "Booking ID"
                            )}
                          </span>

                          <strong
                            style={{
                              color:
                                "var(--ink)"
                            }}
                          >
                            #
                            {
                              booking.id
                            }
                          </strong>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}

            {cancellationBooking && (
              <div className="bookingModal" role="dialog" aria-modal="true">
                <div className="bookingModalContent">
                  <h3>
                    {t(
                      "هل تريدين إلغاء هذا الحجز؟",
                      "Do you want to cancel this booking?"
                    )}
                  </h3>

                  <p>
                    {t(
                      "سيبقى الحجز محفوظاً، وسيتم تغيير حالته إلى ملغى.",
                      "The booking will be preserved and its status will change to cancelled."
                    )}
                  </p>

                  <label>
                    {t(
                      "ملاحظة الإلغاء (اختيارية)",
                      "Cancellation note (optional)"
                    )}

                    <textarea
                      value={cancellationNote}
                      onChange={(e) => setCancellationNote(e.target.value)}
                      rows={3}
                    />
                  </label>

                  <div className="bookingModalActions">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={confirmCancellation}
                      disabled={cancellingBooking}
                    >
                      {cancellingBooking
                        ? t("جارٍ الإلغاء...", "Cancelling...")
                        : t("تأكيد الإلغاء", "Confirm cancellation")}
                    </button>

                    <button
                      type="button"
                      className="btn ghost"
                      onClick={closeCancellation}
                      disabled={cancellingBooking}
                    >
                      {t("رجوع", "Back")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================
            FAQ
        ================================= */}
        <section className="section faq">
          <div className="container">
            <div className="sectionHead">
              <span className="sectionTag">
                FAQ
              </span>

              <h2>
                {t(
                  "أسئلة شائعة",
                  "Frequently asked questions"
                )}
              </h2>
            </div>

            {[
              [
                t(
                  "هل الحجز يتثبت مباشرة؟",
                  "Is the booking confirmed immediately?"
                ),
                t(
                  "لا. يتم إرسال الطلب أولاً، ثم تراجعه الإدارة. بعد الموافقة يصبح الموعد مؤكداً ومثبتاً.",
                  "No. The request is reviewed by the admin first. After approval, the appointment becomes confirmed."
                )
              ],
              [
                t(
                  "هل يمكن اختيار يوم الجمعة؟",
                  "Can Friday be booked?"
                ),
                t(
                  "نعتذر، لا توجد مواعيد متاحة في هذا اليوم. يرجى اختيار تاريخ آخر للحجز.",
                  "We're sorry, no appointments are available on this day. Please choose another date."
                )
              ],
              [
                t(
                  "هل جميع الجلسات مدتها ساعة؟",
                  "Are all sessions one hour?"
                ),
                t(
                  "النظام مضبوط افتراضياً على ساعة لكل موعد، ويمكن تعديل ذلك لاحقاً إذا تغيرت سياسة العيادة.",
                  "The system defaults to one hour per appointment and can be changed later if clinic policy changes."
                )
              ],
              [
                t(
                  "كيف أتابع حالة حجزي؟",
                  "How can I track my booking?"
                ),
                t(
                  "من قسم حجوزاتي، أدخلي نفس رقم الهاتف المستخدم عند إرسال طلب الحجز، وستظهر لك الحجوزات وحالتها.",
                  "Use the My Bookings section and enter the same phone number used when submitting the booking request."
                )
              ]
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}

                  <ChevronDown
                    size={18}
                  />
                </summary>

                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ================================
            CONTACT
        ================================= */}
        <section
          id="contact"
          className="section contact"
        >
          <div className="container contactCard">
            <div>
              <span className="sectionTag">
                {t(
                  "التواصل",
                  "Contact"
                )}
              </span>

              <h2>
                {t(
                  "نلتقي بكِ في العيادة",
                  "We look forward to welcoming you"
                )}
              </h2>

              <p>
                {t(
                  "الرقة — المنصورة — شارع الأطباء",
                  "Al-Raqqa — Al-Mansoura — Doctors Street"
                )}
              </p>
            </div>

            <div className="contactLinks">
              

              <a href="mailto:Braahumaidy521@gamil.com">
                <Mail size={18} />
                Braahumaidy521@gamil.com
              </a>

              <div className="socialLinks">
                <a
                  href="https://www.facebook.com/share/19EECrUved/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("فيسبوك", "Facebook")}
                >
                  <Facebook size={18} />
                  {t("فيسبوك", "Facebook")}
                </a>

                <a
                  href="https://www.instagram.com/braah_humaidy?stkn=MTNtNDY5dTJydG5sbA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("إنستغرام", "Instagram")}
                >
                  <Instagram size={18} />
                  {t("إنستغرام", "Instagram")}
                </a>

                <a
                  href="https://wa.me/963939757130"
                  aria-label={t("واتساب", "WhatsApp")}
                >
                  <MessageCircle size={18} />
                  <span>
                    {t("واتساب", "WhatsApp")} - 0939757130
                  </span>
                </a>
              </div>

              <span>
                <MapPin size={18} />

                {t(
                  "الرقة، المنصورة، شارع الأطباء",
                  "Al-Raqqa, Al-Mansoura, Doctors Street"
                )}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footerInner">
          <span>
            ©{" "}
            {new Date().getFullYear()}{" "}
            Baraa Aesthetics
          </span>

          <span>
            {t(
              "براءة للتجميل غير الجراحي",
              "Non-surgical aesthetics"
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);