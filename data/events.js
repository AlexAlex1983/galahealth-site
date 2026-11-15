/* ==========================================================================
   Respiratory Health Calendar — the ONLY file to edit for campaigns.

   Each event repeats every year. Its date is worked out automatically:
     date: { month: 11, day: 12 }                      -> fixed date (12 Nov)
     date: { month: 11, nth: 3, weekday: "Wed" }      -> 3rd Wednesday of November
     date: { month: 11, wholeMonth: true }            -> awareness month
   Months are 1-12. Use nth: -1 for "last" (e.g. last Friday).

   themes: official theme per year. If the year is missing, the site shows
           "Theme to be announced" for that year.
   message: GALA Health's own key message for the day (shown + used for sharing).
   ========================================================================== */
window.GALA_EVENTS = [
  {
    id: "world-copd-day",
    name: "World COPD Day",
    organiser: "GOLD",
    link: "https://goldcopd.org/",
    date: { month: 11, nth: 3, weekday: "Wed" },
    themes: { 2026: "Early Diagnosis and Management for a Better Life" },
    message: "Most people living with COPD are diagnosed late, or never. Countries that invest in spirometry and primary care detect it earlier, treat it better and save lives.",
    hashtags: ["WorldCOPDDay", "LungHealth"],
    color: "navy",
  },
  {
    id: "lung-cancer-awareness-month",
    name: "Lung Cancer Awareness Month",
    organiser: "",
    link: "",
    date: { month: 11, wholeMonth: true },
    themes: {},
    message: "Lung cancer is the leading cause of cancer death worldwide. Tobacco control, clean air and early detection belong in every national NCD plan.",
    hashtags: ["LungCancerAwarenessMonth", "LungHealth"],
    color: "cream",
  },
  {
    id: "world-pneumonia-day",
    name: "World Pneumonia Day",
    organiser: "Every Breath Counts Coalition",
    link: "https://stoppneumonia.org/latest/world-pneumonia-day/",
    date: { month: 11, day: 12 },
    themes: { 2025: "Child Survival", 2026: "A New Era of Pneumonia Control" },
    message: "Pneumonia is preventable and treatable. Vaccines, oxygen and clean air protect children and older people alike — and protect lungs for life.",
    hashtags: ["WorldPneumoniaDay", "StopPneumonia"],
    color: "cream",
  },
  {
    id: "world-tb-day",
    name: "World TB Day",
    organiser: "WHO",
    link: "https://www.who.int/campaigns/world-tb-day",
    date: { month: 3, day: 24 },
    themes: {},
    message: "TB survivors often live with lasting lung damage. Post-TB lung disease must be part of chronic respiratory care.",
    hashtags: ["WorldTBDay", "EndTB"],
    color: "cream",
  },
  {
    id: "world-asthma-day",
    name: "World Asthma Day",
    organiser: "GINA",
    link: "https://ginasthma.org/",
    date: { month: 5, nth: 1, weekday: "Tue" },
    themes: { 2026: "Access to anti-inflammatory inhalers for everyone with asthma – still an urgent need" },
    message: "No one should die from asthma for lack of an inhaler. Essential inhaled medicines must be affordable and available in every country.",
    hashtags: ["WorldAsthmaDay", "LungHealth"],
    color: "orange",
  },
  {
    id: "world-no-tobacco-day",
    name: "World No Tobacco Day",
    organiser: "WHO",
    link: "https://www.who.int/campaigns/world-no-tobacco-day",
    date: { month: 5, day: 31 },
    themes: {},
    message: "Tobacco is the leading preventable cause of COPD and lung cancer. Strong tobacco control is the most cost-effective lung health policy a country can adopt.",
    hashtags: ["WorldNoTobaccoDay", "NoTobacco"],
    color: "navy",
  },
  {
    id: "world-environment-day",
    name: "World Environment Day",
    organiser: "UNEP",
    link: "https://www.worldenvironmentday.global/",
    date: { month: 6, day: 5 },
    themes: {},
    message: "A healthy environment starts with the air we breathe. Air quality policy is lung health policy.",
    hashtags: ["WorldEnvironmentDay", "CleanAir"],
    color: "cream",
  },
  {
    id: "clean-air-day",
    name: "International Day of Clean Air for blue skies",
    organiser: "United Nations",
    link: "https://www.un.org/en/observances/clean-air-day",
    date: { month: 9, day: 7 },
    themes: {},
    message: "Air pollution drives COPD, asthma and lung cancer. Cleaner air means fewer hospital admissions and longer, healthier lives.",
    hashtags: ["CleanAir", "LungHealth"],
    color: "cream",
  },
  {
    id: "world-lung-day",
    name: "World Lung Day",
    organiser: "FIRS",
    link: "https://firsnet.org/campaigns/",
    date: { month: 9, day: 25 },
    themes: { 2026: "A Lifetime of Lung Health" },
    message: "Lung health is built across the whole life course — from clean air in childhood to care and support in older age.",
    hashtags: ["WorldLungDay", "LungHealth"],
    color: "orange",
  },
];
