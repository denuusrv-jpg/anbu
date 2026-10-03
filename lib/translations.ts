export type Language = "de" | "ta" | "en";

export const languages: Language[] = ["de", "ta", "en"];

type GroupItem = {
  title: string;
  size: string;
  description: string;
};

type FeatureItem = {
  title: string;
  description: string;
};

export type Translation = {
  nav: {
    erfahreMehr: string;
    mission: string;
    kontakt: string;
  };
  hero: {
    heading: [string, string];
    description: string;
  };
  waitlist: {
    login: string;
    register: string;
    note: string;
  };
  share: {
    text: string;
    copied: string;
  };
  hubs: {
    heading: string;
    list: string[];
    badgeActive: string;
    infoText: string;
  };
  groups: {
    heading: string;
    subheading: string;
    items: GroupItem[];
  };
  ai: {
    badge: string;
    heading: string;
    description: string;
  };
  features: {
    items: FeatureItem[];
  };
  footer: {
    tagline: string;
    impressum: string;
    datenschutz: string;
  };
  cta: {
    signUp: string;
  };
  waitlistCapture: {
    placeholder: string;
    button: string;
    success: string;
    retry: string;
  };
};

export const translations: Record<Language, Translation> = {
  de: {
    nav: {
      erfahreMehr: "Erfahre mehr",
      mission: "Unsere Mission",
      kontakt: "Kontakt",
    },
    hero: {
      heading: ["Deine neuen Connection", "warten in deiner Umgebung"],
      description:
        "Echte Freundschaften, neu gedacht. Ein intelligentes KI-System bildet passgenaue Gruppen, anhand von Informationen deiner Persönlichkeit. 100 % kostenlos und anonym für die Tamil-Community im deutschsprachigen Raum.",
    },
    waitlist: {
      login: "Anmelden",
      register: "Registrieren",
      note: "Kein Spam. Ab 100 Anmeldungen startet deine Region.",
    },
    share: {
      text: "Teile den Link – so wird dein Hub schneller freigeschaltet",
      copied: "Link kopiert!",
    },
    hubs: {
      heading: "Regionale Hubs & der Startschuss",
      list: [
        "Hub NRW (Ruhrgebiet & Rheinland)",
        "Hub Rhein-Main (Frankfurt & Hessen)",
        "Hub Baden-Württemberg (Stuttgart & Südwesten)",
        "Hub Bayern & Allgäu (München & Allgäu)",
        "Hub Hauptstadt & Ost (Berlin & Ostdeutschland)",
        "Hub Hamburg & Nord (Hamburg & Norddeutschland)",
        "Hub Schweiz (Zürich & Ostschweiz)",
        "Hub Österreich (Wien & Österreich)",
      ],
      badgeActive: "Warteliste aktiv",
      infoText:
        "Sobald sich 100 Personen in einer Region eintragen, öffnet sich das Hub. Der erste Schritt: Du erhältst eine E-Mail mit dem Link zu unserem KI-Persönlichkeits-Check, der dein optimales Match ermittelt. Das Ganze bleibt anfangs vollkommen anonym.",
    },
    groups: {
      heading: "Gemeinschaft nach Maß",
      subheading:
        "Kein starrer Zwang – wähle die Gruppengröße, die zu deinem sozialen Akku passt.",
      items: [
        {
          title: "Duo",
          size: "2er Gruppe",
          description:
            "Ideal für sportliche Workouts, Joggen oder den ruhigen Austausch beim Kaffee.",
        },
        {
          title: "Crew",
          size: "4er Gruppe",
          description:
            "Ideal für gemeinsame Spieleabende, Gaming oder tolle Veranstaltungen.",
        },
        {
          title: "Squad",
          size: "8er Gruppe",
          description:
            "Ideal für lebendige Events, gemeinsame Ausflüge oder aktive Tanzgruppen.",
        },
      ],
    },
    ai: {
      badge: "Powered by AI",
      heading: "Der KI-Persönlichkeits-Check",
      description:
        "Keine starren Fragebögen. Du führst ein entspanntes Gespräch mit unserer künstlichen Intelligenz – wie lange es dauert, liegt ganz bei dir. Sie versteht deinen Humor und deine Interessen und findet so dein perfektes Match für Duo, Crew oder Squad.",
    },
    features: {
      items: [
        {
          title: "Connections in deiner Region",
          description:
            "Die KI vernetzt dich mit Leuten aus deiner Nähe, die ähnliche Interessen haben — z.B. Sport, Gaming oder Kultur.",
        },
        {
          title: "100% gratis und diskret",
          description:
            "Kein Foto, keine Handynummer nötig — ihr chattet sicher direkt in der Webseite, ganz ohne Stigma-Druck.",
        },
        {
          title: "Echte Treffen statt Chatten",
          description:
            "Von der Webseite direkt zum gemeinsamen Treffen — Freundschaften vor Ort statt endlosem Hin-und-her-Schreiben.",
        },
      ],
    },
    footer: {
      tagline: "DSpora · gebaut mit ♥ für die tamilische Diaspora im DACH-Raum",
      impressum: "Impressum",
      datenschutz: "Datenschutz",
    },
    cta: {
      signUp: "Registriere dich jetzt",
    },
    waitlistCapture: {
      placeholder: "deine@mail.com",
      button: "Beitreten",
      success: "Fast geschafft! Prüfe dein Postfach",
      retry: "Andere E-Mail eingeben",
    },
  },
  en: {
    nav: {
      erfahreMehr: "Learn more",
      mission: "Our Mission",
      kontakt: "Contact",
    },
    hero: {
      heading: ["Your new connections", "are waiting nearby"],
      description:
        "Real friendships, reimagined. An intelligent AI system forms perfectly matched groups based on your personality. 100% free and anonymous for the Tamil community across the German-speaking region.",
    },
    waitlist: {
      login: "Sign in",
      register: "Register",
      note: "No spam. Your region unlocks at 100 sign-ups.",
    },
    share: {
      text: "Share the link – it unlocks your hub faster",
      copied: "Link copied!",
    },
    hubs: {
      heading: "Regional hubs & the launch",
      list: [
        "NRW hub (Ruhr area & Rhineland)",
        "Rhine-Main hub (Frankfurt & Hesse)",
        "Baden-Württemberg hub (Stuttgart & Southwest)",
        "Bavaria & Allgäu hub (Munich & Allgäu)",
        "Capital & East hub (Berlin & East Germany)",
        "Hamburg & North hub (Hamburg & Northern Germany)",
        "Switzerland hub (Zurich & Eastern Switzerland)",
        "Austria hub (Vienna & Austria)",
      ],
      badgeActive: "Waitlist active",
      infoText:
        "As soon as 100 people in a region sign up, the hub unlocks. The first step: you'll get an email with the link to our AI personality check, which finds your ideal match. It all stays completely anonymous at first.",
    },
    groups: {
      heading: "Community, your size",
      subheading:
        "No rigid rules – pick the group size that matches your social battery.",
      items: [
        {
          title: "Duo",
          size: "Group of 2",
          description:
            "Great for workouts, jogging, or a relaxed chat over coffee.",
        },
        {
          title: "Crew",
          size: "Group of 4",
          description: "Great for game nights, hangouts, or fun events.",
        },
        {
          title: "Squad",
          size: "Group of 8",
          description: "Great for lively events, group trips, or dance crews.",
        },
      ],
    },
    ai: {
      badge: "Powered by AI",
      heading: "The AI personality check",
      description:
        "No rigid questionnaires. You have a relaxed conversation with our AI – how long it takes is entirely up to you. It picks up on your humor and interests to find your perfect match for Duo, Crew, or Squad.",
    },
    features: {
      items: [
        {
          title: "Connections near you",
          description:
            "Our AI connects you with people nearby who share similar interests — like sports, gaming, or culture.",
        },
        {
          title: "100% free and discreet",
          description:
            "No photo or phone number required — chat safely right on the website, with zero stigma.",
        },
        {
          title: "Real meetups, not just chatting",
          description:
            "Straight from the website to meeting up in person — friendships offline, not endless texting.",
        },
      ],
    },
    footer: {
      tagline: "DSpora · built with ♥ for the Tamil diaspora across the DACH region",
      impressum: "Legal notice",
      datenschutz: "Privacy policy",
    },
    cta: {
      signUp: "Sign up now",
    },
    waitlistCapture: {
      placeholder: "your@mail.com",
      button: "Join",
      success: "Almost there! Check your inbox",
      retry: "Enter a different email",
    },
  },
  ta: {
    nav: {
      erfahreMehr: "மேலும் அறிக",
      mission: "எங்கள் நோக்கம்",
      kontakt: "தொடர்பு",
    },
    hero: {
      heading: ["உன் புதிய நட்புகள்", "உன் சுற்றுப்புறத்தில் காத்திருக்கின்றன"],
      description:
        "உண்மையான நட்புகள், புதிய முறையில். ஒரு அறிவார்ந்த AI அமைப்பு உங்கள் ஆளுமைத் தகவல்களின் அடிப்படையில் பொருத்தமான குழுக்களை உருவாக்குகிறது. ஜெர்மன் மொழி பேசும் நாடுகளில் உள்ள தமிழ் சமூகத்திற்கு 100% இலவசமாகவும் அநாமதேயமாகவும்.",
    },
    waitlist: {
      login: "உள்நுழையுங்கள்",
      register: "பதிவு செய்யுங்கள்",
      note: "ஸ்பேம் இல்லை. 100 பதிவுகள் நிறைந்தவுடன் உங்கள் பகுதி தொடங்கும்.",
    },
    share: {
      text: "இணைப்பைப் பகிரவும் – உங்கள் மையம் விரைவில் திறக்கும்",
      copied: "இணைப்பு நகலெடுக்கப்பட்டது!",
    },
    hubs: {
      heading: "பிராந்திய மையங்கள் & தொடக்கம்",
      list: [
        "NRW மையம் (ரூர் & ரைன்லாந்து)",
        "ரைன்-மைன் மையம் (ஃபிராங்க்ஃபர்ட் & ஹெசன்)",
        "பேடன்-வூர்டெம்பெர்க் மையம் (ஸ்டுட்கார்ட் & தென்மேற்கு)",
        "பவேரியா & அல்காய் மையம் (முனிச் & அல்காய்)",
        "தலைநகர் & கிழக்கு மையம் (பெர்லின் & கிழக்கு ஜெர்மனி)",
        "ஹாம்பர்க் & வடக்கு மையம் (ஹாம்பர்க் & வட ஜெர்மனி)",
        "சுவிட்சர்லாந்து மையம் (சூரிக் & கிழக்கு சுவிட்சர்லாந்து)",
        "ஆஸ்திரியா மையம் (வியன்னா & ஆஸ்திரியா)",
      ],
      badgeActive: "காத்திருப்பு பட்டியல் செயலில்",
      infoText:
        "ஒரு பகுதியில் 100 பேர் பதிவு செய்தவுடன், அந்த மையம் திறக்கப்படும். முதல் படி: எங்கள் AI ஆளுமை சோதனைக்கான இணைப்புடன் ஒரு மின்னஞ்சல் உங்களுக்கு வரும், இது உங்கள் சரியான பொருத்தத்தைக் கண்டறியும். இது ஆரம்பத்தில் முற்றிலும் அநாமதேயமாகவே இருக்கும்.",
    },
    groups: {
      heading: "உங்களுக்கேற்ற குழு அளவு",
      subheading:
        "கட்டாயம் இல்லை – உங்கள் மனநிலைக்கு ஏற்ற குழு அளவைத் தேர்ந்தெடுங்கள்.",
      items: [
        {
          title: "Duo",
          size: "2 பேர் குழு",
          description:
            "விளையாட்டு, ஓட்டப்பயிற்சி அல்லது அமைதியான காபி உரையாடலுக்கு ஏற்றது.",
        },
        {
          title: "Crew",
          size: "4 பேர் குழு",
          description:
            "விளையாட்டு மாலைப்பொழுது, சந்திப்புகள் அல்லது நிகழ்வுகளுக்கு ஏற்றது.",
        },
        {
          title: "Squad",
          size: "8 பேர் குழு",
          description:
            "சுறுசுறுப்பான நிகழ்வுகள், குழு உல்லாசப் பயணங்கள் அல்லது நடன குழுக்களுக்கு ஏற்றது.",
        },
      ],
    },
    ai: {
      badge: "AI ஆல் இயக்கப்படுகிறது",
      heading: "AI ஆளுமை சோதனை",
      description:
        "கடுமையான கேள்வித்தாள்கள் இல்லை. எங்கள் AI உடன் ஒரு இலகுவான உரையாடலை நடத்துவீர்கள் – அது எவ்வளவு நேரம் எடுக்கும் என்பது முழுவதும் உங்கள் விருப்பம். இது உங்கள் நகைச்சுவை உணர்வையும் ஆர்வங்களையும் புரிந்துகொண்டு Duo, Crew அல்லது Squad-க்கான உங்கள் சரியான பொருத்தத்தைக் கண்டறியும்.",
    },
    features: {
      items: [
        {
          title: "உங்கள் பகுதியில் தொடர்புகள்",
          description:
            "விளையாட்டு, கேமிங் அல்லது கலாச்சாரம் போன்ற ஒத்த ஆர்வங்களைக் கொண்ட உங்களுக்கு அருகிலுள்ளவர்களுடன் AI உங்களை இணைக்கிறது.",
        },
        {
          title: "100% இலவசம் மற்றும் இரகசியம்",
          description:
            "புகைப்படமோ தொலைபேசி எண்ணோ தேவையில்லை — எந்த அவமானமும் இல்லாமல் வலைத்தளத்திலேயே பாதுகாப்பாக அரட்டையடிக்கலாம்.",
        },
        {
          title: "அரட்டை அல்ல, உண்மையான சந்திப்புகள்",
          description:
            "வலைத்தளத்திலிருந்து நேரடியாக சந்திப்புக்கு — முடிவில்லா செய்திகளுக்குப் பதிலாக நேரடி நட்பு.",
        },
      ],
    },
    footer: {
      tagline:
        "DSpora · ஜெர்மன் மொழி பேசும் நாடுகளில் உள்ள தமிழ் சமூகத்திற்காக ♥ உடன் உருவாக்கப்பட்டது",
      impressum: "சட்டத் தகவல்",
      datenschutz: "தனியுரிமைக் கொள்கை",
    },
    cta: {
      signUp: "இப்போதே பதிவு செய்யுங்கள்",
    },
    waitlistCapture: {
      placeholder: "மின்னஞ்சல் முகவரி",
      button: "சேரவும்",
      success: "கிட்டத்தட்ட முடிந்தது! உங்கள் இன்பாக்ஸைப் பார்க்கவும்",
      retry: "வேறு மின்னஞ்சலை உள்ளிடவும்",
    },
  },
};
