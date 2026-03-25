import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BedDouble,
  Clock3,
  Footprints,
  HeartPulse,
  Lightbulb,
  Pencil,
  Plus,
  Route as RouteIcon,
  Trash2,
  UserRound,
} from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { useApp } from '../context/AppContext'
import { t } from '../i18n'
import { getHealthData, syncStravaActivities } from '../services/api'
import { cacheHealthData, checkHealthAndNotify } from '../services/notificationService'

const DASHBOARD_COPY = {
  English: {
    offline: 'Showing cached data (Offline)',
    hello: 'Hello! 👋',
    user: 'User',
    openProfile: 'Open profile',
    healthScore: 'Health Score',
    lastUpdated: 'Last updated today at',
    thisWeek: 'This Week',
    dailyHealthTip: 'Daily Health Tip',
    learnMore: 'Learn More',
    upcomingAppointments: 'Upcoming Appointments',
    addAppointment: 'Add Appointment',
    noUpcomingAppointments: 'No upcoming appointments',
    elapsed: 'Elapsed',
    deleteConfirm: 'Delete this appointment?',
    allHealthTips: 'All Health Tips',
    close: 'Close',
    set: 'Set',
    goal: 'Goal',
    cancel: 'Cancel',
    save: 'Save',
    add: 'Add',
    steps: 'Steps',
    sleep: 'Sleep',
    distance: 'Distance',
    bpm: 'BPM',
    low: 'Low',
    high: 'High',
    normal: 'Normal',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    needsAttention: 'Needs attention',
    of: 'of',
    hoursShort: 'h',
    minutesShort: 'm',
    stepsUnit: 'steps',
    hoursUnit: 'hours',
    metersUnit: 'meters',
    addAppointmentTitle: 'Add Appointment',
    titlePlaceholder: 'Title',
    descriptionPlaceholder: 'Description',
    appointment: 'Appointment',
    editStepsGoal: 'Edit steps goal',
    editSleepGoal: 'Edit sleep goal',
    editDistanceGoal: 'Edit distance goal',
    deleteAppointment: 'Delete appointment',
  },
  Hindi: {
    offline: 'कैश डेटा दिखाया जा रहा है (ऑफलाइन)',
    hello: 'नमस्ते! 👋',
    user: 'उपयोगकर्ता',
    openProfile: 'प्रोफ़ाइल खोलें',
    healthScore: 'स्वास्थ्य स्कोर',
    lastUpdated: 'आज अंतिम अपडेट:',
    thisWeek: 'इस सप्ताह',
    dailyHealthTip: 'दैनिक स्वास्थ्य सुझाव',
    learnMore: 'अधिक जानें',
    upcomingAppointments: 'आगामी नियुक्तियाँ',
    addAppointment: 'भेंट जोड़ें',
    noUpcomingAppointments: 'आगामी भेंट नहीं',
    elapsed: 'समय बीत गया',
    deleteConfirm: 'क्या आप यह भेंट हटाना चाहते हैं?',
    allHealthTips: 'सभी स्वास्थ्य सुझाव',
    close: 'बंद करें',
    set: 'सेट करें',
    goal: 'लक्ष्य',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    add: 'जोड़ें',
    steps: 'कदम',
    sleep: 'नींद',
    distance: 'दूरी',
    bpm: 'BPM',
    low: 'कम',
    high: 'उच्च',
    normal: 'सामान्य',
    excellent: 'उत्कृष्ट',
    good: 'अच्छा',
    fair: 'ठीक-ठाक',
    needsAttention: 'ध्यान आवश्यक',
    of: 'में से',
    hoursShort: 'घं',
    minutesShort: 'मि',
    stepsUnit: 'कदम',
    hoursUnit: 'घंटे',
    metersUnit: 'मीटर',
    addAppointmentTitle: 'भेंट जोड़ें',
    titlePlaceholder: 'शीर्षक',
    descriptionPlaceholder: 'विवरण',
    appointment: 'भेंट',
    editStepsGoal: 'कदम लक्ष्य संपादित करें',
    editSleepGoal: 'नींद लक्ष्य संपादित करें',
    editDistanceGoal: 'दूरी लक्ष्य संपादित करें',
    deleteAppointment: 'भेंट हटाएँ',
  },
  Marathi: {
    offline: 'कॅश डेटा दाखवत आहे (ऑफलाइन)',
    hello: 'नमस्कार! 👋',
    user: 'वापरकर्ता',
    openProfile: 'प्रोफाइल उघडा',
    healthScore: 'आरोग्य स्कोअर',
    lastUpdated: 'आज शेवटचे अपडेट:',
    thisWeek: 'हा आठवडा',
    dailyHealthTip: 'दैनिक आरोग्य सूचना',
    learnMore: 'अधिक जाणून घ्या',
    upcomingAppointments: 'आगामी भेटी',
    addAppointment: 'भेट जोडा',
    noUpcomingAppointments: 'आगामी भेट नाही',
    elapsed: 'वेळ संपली',
    deleteConfirm: 'ही भेट हटवायची आहे का?',
    allHealthTips: 'सर्व आरोग्य सूचना',
    close: 'बंद करा',
    set: 'सेट करा',
    goal: 'लक्ष्य',
    cancel: 'रद्द करा',
    save: 'जतन करा',
    add: 'जोडा',
    steps: 'पावले',
    sleep: 'झोप',
    distance: 'अंतर',
    bpm: 'BPM',
    low: 'कमी',
    high: 'जास्त',
    normal: 'सामान्य',
    excellent: 'उत्कृष्ट',
    good: 'चांगले',
    fair: 'ठीक',
    needsAttention: 'लक्ष आवश्यक',
    of: 'पैकी',
    hoursShort: 'ता',
    minutesShort: 'मि',
    stepsUnit: 'पावले',
    hoursUnit: 'तास',
    metersUnit: 'मीटर',
    addAppointmentTitle: 'भेट जोडा',
    titlePlaceholder: 'शीर्षक',
    descriptionPlaceholder: 'वर्णन',
    appointment: 'भेट',
    editStepsGoal: 'पावले लक्ष्य संपादित करा',
    editSleepGoal: 'झोप लक्ष्य संपादित करा',
    editDistanceGoal: 'अंतर लक्ष्य संपादित करा',
    deleteAppointment: 'भेट हटवा',
  },
}

const HEALTH_TIPS_BY_LANGUAGE = {
  English: [
    {
      title: 'Drink 8 glasses of water daily for better hydration and improved skin health.',
      description:
        'Water helps flush out toxins, improves digestion, maintains body temperature, and keeps your skin glowing. Aim for 2-3 liters per day.',
    },
    {
      title: 'Take a 10-minute walk after meals to aid digestion and control blood sugar.',
      description:
        'Post-meal walking helps reduce blood sugar spikes, improves metabolism, and aids in better digestion. It can reduce the risk of type 2 diabetes.',
    },
    {
      title: 'Get 7-8 hours of quality sleep each night for optimal brain function.',
      description:
        'Sleep is crucial for memory consolidation, immune function, and mental health. Lack of sleep increases risk of obesity, diabetes, and heart disease.',
    },
    {
      title: 'Practice deep breathing for 5 minutes daily to reduce stress and anxiety.',
      description:
        'Deep breathing activates the parasympathetic nervous system, lowering cortisol levels and blood pressure. It improves oxygen flow and mental clarity.',
    },
    {
      title: 'Eat a rainbow of fruits and vegetables for essential vitamins and minerals.',
      description:
        'Different colored produce provides different antioxidants and nutrients. Aim for 5-9 servings daily to reduce disease risk and boost immunity.',
    },
    {
      title: 'Limit processed sugar intake to reduce inflammation and disease risk.',
      description:
        'Excess sugar contributes to obesity, diabetes, heart disease, and inflammation. Stick to natural sugars from fruits and limit added sugars to 25g/day.',
    },
    {
      title: 'Stand up and stretch every hour if you have a desk job.',
      description:
        'Prolonged sitting increases risk of obesity, diabetes, and cardiovascular disease. Regular movement improves circulation and reduces muscle tension.',
    },
    {
      title: 'Include protein in every meal to maintain muscle mass and feel fuller longer.',
      description:
        'Protein is essential for muscle repair, hormone production, and satiety. Aim for 0.8-1g per kg of body weight from lean meats, fish, legumes, and dairy.',
    },
    {
      title: 'Wash your hands frequently to prevent the spread of infections.',
      description:
        'Hand hygiene is the single most effective way to prevent disease transmission. Wash for 20 seconds with soap, especially before eating and after restroom use.',
    },
    {
      title: 'Limit screen time before bed to improve sleep quality.',
      description:
        'Blue light from screens suppresses melatonin production, disrupting sleep. Stop using devices 1-2 hours before bedtime for better rest.',
    },
    {
      title: 'Practice gratitude daily to boost mental health and happiness.',
      description:
        'Gratitude journaling reduces stress, improves mood, and increases resilience. Write down 3 things you\'re grateful for each day.',
    },
    {
      title: 'Eat mindfully without distractions to improve digestion and prevent overeating.',
      description:
        'Mindful eating helps you recognize hunger and fullness cues, improves nutrient absorption, and enhances your relationship with food.',
    },
    {
      title: 'Include healthy fats like nuts, avocados, and olive oil in your diet.',
      description:
        'Healthy fats support brain function, hormone production, and nutrient absorption. They reduce inflammation and support heart health.',
    },
    {
      title: 'Stay socially connected to reduce stress and improve longevity.',
      description:
        'Strong social bonds lower rates of anxiety, depression, and boost immune function. Regular interaction with loved ones is as important as exercise.',
    },
    {
      title: 'Limit alcohol consumption to maintain liver health and overall wellness.',
      description:
        'Excessive alcohol damages the liver, increases cancer risk, and affects mental health. Stick to moderate drinking: up to 1 drink/day for women, 2 for men.',
    },
    {
      title: 'Take regular breaks from work to prevent burnout and boost productivity.',
      description:
        'The brain needs downtime to process information and maintain focus. Use the 52-17 rule: 52 minutes of work, 17-minute break.',
    },
    {
      title: 'Eat breakfast within an hour of waking to jumpstart your metabolism.',
      description:
        'A healthy breakfast stabilizes blood sugar, improves concentration, and provides energy. Include protein, complex carbs, and healthy fats.',
    },
    {
      title: 'Practice good posture to prevent back pain and improve breathing.',
      description:
        'Poor posture strains muscles, compresses organs, and restricts breathing. Keep shoulders back, chin up, and core engaged while sitting and standing.',
    },
    {
      title: 'Reduce salt intake to lower blood pressure and protect heart health.',
      description:
        'Excess sodium increases blood pressure and fluid retention. Limit to 2,300mg/day (1 teaspoon) by avoiding processed foods and reading labels.',
    },
    {
      title: 'Exercise for at least 30 minutes daily to boost cardiovascular health.',
      description:
        'Regular physical activity strengthens the heart, improves circulation, boosts mood, and reduces risk of chronic diseases. Mix cardio and strength training.',
    },
    {
      title: 'Maintain a healthy weight through balanced diet and regular exercise.',
      description:
        'Healthy weight reduces risk of diabetes, heart disease, and joint problems. Focus on sustainable lifestyle changes rather than quick fixes.',
    },
    {
      title: 'Get regular health checkups to catch potential issues early.',
      description:
        'Preventive care helps detect diseases in early stages when treatment is most effective. Annual physicals, screenings, and dental visits are essential.',
    },
    {
      title: 'Spend time in nature to reduce stress and improve mental clarity.',
      description:
        'Nature exposure lowers cortisol, reduces anxiety, and improves mood. Even 20 minutes outdoors can boost well-being and creativity.',
    },
    {
      title: 'Limit caffeine intake, especially in the afternoon, for better sleep.',
      description:
        'Caffeine has a half-life of 5-6 hours. Consuming it late can disrupt sleep. Limit to 400mg/day (4 cups) and stop by 2 PM.',
    },
    {
      title: 'Practice yoga or meditation to improve flexibility and mental peace.',
      description:
        'Yoga combines physical movement, breathing, and meditation to reduce stress, improve flexibility, and enhance mind-body connection.',
    },
  ],
  Hindi: [
    {
      title: 'बेहतर हाइड्रेशन और त्वचा के लिए रोज़ 8 गिलास पानी पिएँ।',
      description:
        'पानी शरीर से विषैले तत्व बाहर निकालता है, पाचन सुधारता है, तापमान संतुलित रखता है और त्वचा को स्वस्थ बनाता है। रोज़ 2-3 लीटर पानी का लक्ष्य रखें।',
    },
    {
      title: 'भोजन के बाद 10 मिनट टहलें ताकि पाचन सुधरे और शुगर नियंत्रित रहे।',
      description:
        'खाने के बाद चलना ब्लड शुगर स्पाइक कम करता है, मेटाबॉलिज़्म बेहतर करता है और पाचन में मदद करता है। इससे टाइप-2 डायबिटीज़ का जोखिम भी घटता है।',
    },
    {
      title: 'दिमाग और शरीर के लिए हर रात 7-8 घंटे की अच्छी नींद लें।',
      description:
        'पर्याप्त नींद याददाश्त, रोग प्रतिरोधक क्षमता और मानसिक स्वास्थ्य के लिए जरूरी है। नींद की कमी से मोटापा, डायबिटीज़ और हृदय रोग का खतरा बढ़ता है।',
    },
    {
      title: 'तनाव और चिंता कम करने के लिए रोज़ 5 मिनट गहरी साँस लें।',
      description:
        'दीप ब्रीदिंग पैरासिम्पेथेटिक सिस्टम सक्रिय करती है, जिससे कॉर्टिसोल और ब्लड प्रेशर कम होता है। इससे ऑक्सीजन फ्लो और मानसिक स्पष्टता बढ़ती है।',
    },
    {
      title: 'जरूरी विटामिन और मिनरल्स के लिए रंग-बिरंगे फल-सब्ज़ियाँ खाएँ।',
      description:
        'अलग-अलग रंग के फल-सब्ज़ियाँ अलग पोषक तत्व और एंटीऑक्सीडेंट देती हैं। रोज़ 5-9 सर्विंग लेने से रोग जोखिम कम होता है और प्रतिरोधक क्षमता बढ़ती है।',
    },
    {
      title: 'सूजन और बीमारी का खतरा घटाने के लिए प्रोसेस्ड चीनी कम करें।',
      description:
        'अधिक चीनी मोटापा, डायबिटीज़, हृदय रोग और सूजन बढ़ाती है। फल जैसी प्राकृतिक शर्करा चुनें और अतिरिक्त चीनी को 25 ग्राम/दिन तक सीमित रखें।',
    },
    {
      title: 'डेस्क जॉब हो तो हर घंटे उठकर स्ट्रेच करें।',
      description:
        'लंबे समय तक बैठे रहने से मोटापा, डायबिटीज़ और हृदय रोग का जोखिम बढ़ता है। नियमित मूवमेंट से रक्त संचार बेहतर होता है और मांसपेशियों का तनाव घटता है।',
    },
    {
      title: 'हर भोजन में प्रोटीन शामिल करें ताकि मांसपेशियाँ बनी रहें और भूख कम लगे।',
      description:
        'प्रोटीन मांसपेशियों की मरम्मत, हार्मोन निर्माण और लंबे समय तक पेट भरा रखने में मदद करता है। 0.8-1 ग्राम प्रति किलो बॉडी वेट का लक्ष्य रखें।',
    },
    {
      title: 'संक्रमण से बचने के लिए हाथ बार-बार धोएँ।',
      description:
        'हाथों की स्वच्छता संक्रमण रोकने का सबसे प्रभावी तरीका है। साबुन से कम से कम 20 सेकंड हाथ धोएँ, खासकर खाने से पहले और वॉशरूम के बाद।',
    },
    {
      title: 'बेहतर नींद के लिए सोने से पहले स्क्रीन टाइम कम करें।',
      description:
        'स्क्रीन की ब्लू लाइट मेलाटोनिन कम करती है और नींद खराब करती है। सोने से 1-2 घंटे पहले फोन/स्क्रीन का उपयोग बंद करें।',
    },
    {
      title: 'मानसिक स्वास्थ्य के लिए रोज़ कृतज्ञता का अभ्यास करें।',
      description:
        'ग्रैटिट्यूड जर्नलिंग तनाव कम करती है, मूड बेहतर करती है और मानसिक मजबूती बढ़ाती है। रोज़ 3 चीज़ें लिखें जिनके लिए आप आभारी हैं।',
    },
    {
      title: 'बिना ध्यान भटकाए mindful eating करें ताकि पाचन सुधरे और ओवरईटिंग न हो।',
      description:
        'ध्यान से खाने पर भूख और पेट भरने के संकेत बेहतर समझ आते हैं। इससे पोषक अवशोषण बेहतर होता है और भोजन से संबंध स्वस्थ बनता है।',
    },
    {
      title: 'नट्स, एवोकाडो और ऑलिव ऑयल जैसे हेल्दी फैट शामिल करें।',
      description:
        'हेल्दी फैट दिमाग, हार्मोन और पोषक अवशोषण के लिए जरूरी हैं। ये सूजन घटाते हैं और हृदय स्वास्थ्य को समर्थन देते हैं।',
    },
    {
      title: 'तनाव घटाने और लंबी उम्र के लिए सामाजिक रूप से जुड़े रहें।',
      description:
        'मजबूत सामाजिक संबंध चिंता और अवसाद कम करते हैं तथा प्रतिरोधक क्षमता बढ़ाते हैं। परिवार और दोस्तों से नियमित संपर्क बहुत जरूरी है।',
    },
    {
      title: 'लिवर और समग्र स्वास्थ्य के लिए शराब का सेवन सीमित रखें।',
      description:
        'अधिक शराब लिवर को नुकसान पहुँचाती है, कैंसर जोखिम बढ़ाती है और मानसिक स्वास्थ्य पर असर डालती है। सीमित सेवन रखें।',
    },
    {
      title: 'बर्नआउट रोकने और उत्पादकता बढ़ाने के लिए काम के बीच ब्रेक लें।',
      description:
        'दिमाग को फोकस बनाए रखने के लिए विराम चाहिए। 52-17 नियम अपनाएँ: 52 मिनट काम और 17 मिनट ब्रेक।',
    },
    {
      title: 'मेटाबॉलिज़्म सक्रिय करने के लिए उठने के एक घंटे के भीतर नाश्ता करें।',
      description:
        'संतुलित नाश्ता ब्लड शुगर स्थिर रखता है, ध्यान बढ़ाता है और ऊर्जा देता है। इसमें प्रोटीन, कॉम्प्लेक्स कार्ब्स और हेल्दी फैट शामिल करें।',
    },
    {
      title: 'पीठ दर्द से बचने और बेहतर साँस के लिए सही पोश्चर रखें।',
      description:
        'गलत पोश्चर मांसपेशियों पर दबाव बढ़ाता है और साँस लेने की क्षमता घटाता है। बैठते और खड़े होते समय कंधे पीछे, ठोड़ी ऊपर रखें।',
    },
    {
      title: 'ब्लड प्रेशर और हृदय सुरक्षा के लिए नमक का सेवन कम करें।',
      description:
        'अधिक सोडियम से ब्लड प्रेशर और पानी रुकना बढ़ता है। प्रोसेस्ड फूड कम करें और लेबल पढ़कर नमक को लगभग 2300mg/दिन तक सीमित रखें।',
    },
    {
      title: 'हृदय स्वास्थ्य के लिए रोज़ कम से कम 30 मिनट व्यायाम करें।',
      description:
        'नियमित व्यायाम हृदय मजबूत करता है, रक्त संचार सुधारता है और मूड बेहतर करता है। कार्डियो और स्ट्रेंथ ट्रेनिंग का मिश्रण रखें।',
    },
    {
      title: 'संतुलित आहार और नियमित व्यायाम से स्वस्थ वजन बनाए रखें।',
      description:
        'स्वस्थ वजन से डायबिटीज़, हृदय रोग और जोड़ों की समस्याओं का जोखिम घटता है। त्वरित उपायों की बजाय टिकाऊ आदतों पर ध्यान दें।',
    },
    {
      title: 'संभावित समस्याएँ जल्दी पकड़ने के लिए नियमित हेल्थ चेकअप कराएँ।',
      description:
        'रोकथाम आधारित जांच से बीमारियाँ शुरुआती चरण में पकड़ में आती हैं। वार्षिक फिजिकल, स्क्रीनिंग और डेंटल चेकअप जरूरी हैं।',
    },
    {
      title: 'तनाव कम करने और मानसिक स्पष्टता के लिए प्रकृति में समय बिताएँ।',
      description:
        'प्रकृति में समय बिताने से कॉर्टिसोल कम होता है, चिंता घटती है और मूड बेहतर होता है। सिर्फ 20 मिनट बाहर रहना भी फायदेमंद है।',
    },
    {
      title: 'बेहतर नींद के लिए खासकर दोपहर के बाद कैफीन सीमित करें।',
      description:
        'कैफीन का असर 5-6 घंटे तक रह सकता है। देर से लेने पर नींद प्रभावित होती है। 400mg/दिन तक रखें और दोपहर 2 बजे के बाद न लें।',
    },
    {
      title: 'लचीलापन और मानसिक शांति के लिए योग या ध्यान करें।',
      description:
        'योग में शारीरिक मूवमेंट, साँस और ध्यान शामिल होता है जो तनाव कम करता है, लचीलापन बढ़ाता है और मन-शरीर संतुलन सुधारता है।',
    },
  ],
  Marathi: [
    {
      title: 'चांगल्या हायड्रेशन आणि त्वचेसाठी दररोज 8 ग्लास पाणी प्या.',
      description:
        'पाणी शरीरातील विषारी घटक बाहेर टाकण्यास मदत करते, पचन सुधारते, शरीराचे तापमान सांभाळते आणि त्वचा निरोगी ठेवते. रोज 2-3 लिटर पाण्याचे लक्ष्य ठेवा.',
    },
    {
      title: 'जेवणानंतर 10 मिनिटे चालल्याने पचन सुधारते आणि साखर नियंत्रणात राहते.',
      description:
        'जेवणानंतर चालल्याने रक्तातील साखरेचा अचानक वाढणारा स्तर कमी होतो, चयापचय सुधारतो आणि पचनाला मदत होते. यामुळे टाइप-2 डायबिटीजचा धोका कमी होतो.',
    },
    {
      title: 'मेंदू आणि शरीरासाठी दररोज 7-8 तासांची चांगली झोप घ्या.',
      description:
        'पुरेशी झोप स्मरणशक्ती, प्रतिकारशक्ती आणि मानसिक आरोग्यासाठी महत्त्वाची आहे. झोपेच्या कमतरतेमुळे स्थूलता, मधुमेह आणि हृदयविकाराचा धोका वाढतो.',
    },
    {
      title: 'ताण आणि चिंत कमी करण्यासाठी दररोज 5 मिनिटे दीर्घ श्वास घ्या.',
      description:
        'दीर्घ श्वसनामुळे पॅरासिंपथेटिक प्रणाली सक्रिय होते, कॉर्टिसोल आणि रक्तदाब कमी होतो. यामुळे ऑक्सिजन प्रवाह आणि मानसिक स्पष्टता वाढते.',
    },
    {
      title: 'आवश्यक जीवनसत्त्वे आणि खनिजांसाठी रंगीबेरंगी फळे-भाज्या खा.',
      description:
        'वेगवेगळ्या रंगांच्या फळभाज्यांमधून वेगवेगळे पोषक घटक आणि अँटीऑक्सिडंट्स मिळतात. रोज 5-9 सर्व्हिंग घेतल्यास रोगांचा धोका कमी होतो.',
    },
    {
      title: 'सूज आणि आजारांचा धोका कमी करण्यासाठी प्रोसेस्ड साखर कमी करा.',
      description:
        'जास्त साखरेमुळे स्थूलता, मधुमेह, हृदयविकार आणि सूज वाढते. फळांमधील नैसर्गिक साखर निवडा आणि अतिरिक्त साखर 25g/दिवस इतकी मर्यादित ठेवा.',
    },
    {
      title: 'डेस्क जॉब असेल तर दर तासाला उभे राहून स्ट्रेच करा.',
      description:
        'दीर्घकाळ बसून राहिल्याने स्थूलता, मधुमेह आणि हृदयविकाराचा धोका वाढतो. नियमित हालचालीमुळे रक्ताभिसरण सुधारते आणि स्नायूंचा ताण कमी होतो.',
    },
    {
      title: 'मांसपेशी टिकवण्यासाठी आणि जास्त वेळ पोट भरल्यासारखे वाटण्यासाठी प्रत्येक जेवणात प्रोटीन घ्या.',
      description:
        'प्रोटीन स्नायू दुरुस्ती, हार्मोन निर्मिती आणि तृप्ती यासाठी आवश्यक आहे. शरीराच्या वजनानुसार 0.8-1g प्रति किलो प्रोटीनचे लक्ष्य ठेवा.',
    },
    {
      title: 'संसर्गाचा प्रसार टाळण्यासाठी हात वारंवार धुवा.',
      description:
        'हातांची स्वच्छता ही संसर्ग रोखण्याची सर्वात प्रभावी पद्धत आहे. विशेषतः जेवणापूर्वी आणि स्वच्छतागृहानंतर 20 सेकंद साबणाने हात धुवा.',
    },
    {
      title: 'चांगल्या झोपेसाठी झोपण्यापूर्वी स्क्रीन टाइम कमी करा.',
      description:
        'स्क्रीनमधील निळा प्रकाश मेलाटोनिन कमी करतो आणि झोप बिघडवतो. झोपण्याच्या 1-2 तास आधी मोबाईल/स्क्रीन वापरणे थांबवा.',
    },
    {
      title: 'मानसिक आरोग्य आणि आनंदासाठी दररोज कृतज्ञता व्यक्त करा.',
      description:
        'कृतज्ञता लिहिण्याची सवय ताण कमी करते, मूड सुधारते आणि मानसिक ताकद वाढवते. रोज 3 गोष्टी लिहा ज्याबद्दल तुम्ही आभारी आहात.',
    },
    {
      title: 'लक्षपूर्वक, विचलनाशिवाय जेवल्याने पचन सुधारते आणि जास्त खाणे कमी होते.',
      description:
        'माइंडफुल ईटिंगमुळे भूक आणि तृप्तीचे संकेत स्पष्ट समजतात. त्यामुळे पोषक शोषण चांगले होते आणि अन्नाशी आरोग्यदायी संबंध तयार होतो.',
    },
    {
      title: 'नट्स, ऍव्होकॅडो आणि ऑलिव्ह ऑइलसारखे हेल्दी फॅट आहारात घ्या.',
      description:
        'हेल्दी फॅट मेंदू, हार्मोन्स आणि पोषक शोषणासाठी महत्त्वाचे आहेत. ते सूज कमी करतात आणि हृदय आरोग्यास मदत करतात.',
    },
    {
      title: 'ताण कमी करण्यासाठी आणि आयुष्याची गुणवत्ता वाढवण्यासाठी सामाजिक नाती जपा.',
      description:
        'मजबूत सामाजिक संबंध चिंता आणि नैराश्य कमी करतात आणि प्रतिकारशक्ती वाढवतात. नियमित संवाद व्यायामाइतकाच महत्त्वाचा आहे.',
    },
    {
      title: 'यकृत आणि एकूण आरोग्यासाठी मद्यपान मर्यादित ठेवा.',
      description:
        'अतिरिक्त मद्यपान यकृताला हानी पोहोचवते, कर्करोगाचा धोका वाढवते आणि मानसिक आरोग्यावर परिणाम करते. मर्यादित सेवन पाळा.',
    },
    {
      title: 'बर्नआउट टाळण्यासाठी आणि उत्पादकता वाढवण्यासाठी कामात नियमित ब्रेक घ्या.',
      description:
        'मेंदूला माहिती प्रक्रिया आणि फोकस टिकवण्यासाठी विश्रांतीची गरज असते. 52-17 नियम वापरा: 52 मिनिटे काम आणि 17 मिनिटे ब्रेक.',
    },
    {
      title: 'मेटाबॉलिझम सुरू करण्यासाठी उठल्यानंतर एका तासात नाश्ता करा.',
      description:
        'संतुलित नाश्ता रक्तातील साखर स्थिर ठेवतो, एकाग्रता सुधारतो आणि ऊर्जा देतो. त्यात प्रोटीन, कॉम्प्लेक्स कार्ब्स आणि हेल्दी फॅट घाला.',
    },
    {
      title: 'पाठदुखी टाळण्यासाठी आणि श्वसन सुधारण्यासाठी योग्य पोश्चर ठेवा.',
      description:
        'चुकीच्या पोश्चरमुळे स्नायूंवर ताण येतो आणि श्वसन क्षमता कमी होते. बसताना आणि उभे राहताना खांदे मागे व हनुवटी सरळ ठेवा.',
    },
    {
      title: 'रक्तदाब कमी ठेवण्यासाठी आणि हृदय सुरक्षित ठेवण्यासाठी मीठ कमी करा.',
      description:
        'जास्त सोडियममुळे रक्तदाब आणि द्रव साठा वाढतो. प्रोसेस्ड फूड कमी करा आणि लेबल वाचून मीठ 2300mg/दिवस इतके मर्यादित ठेवा.',
    },
    {
      title: 'हृदयविकाराचा धोका कमी करण्यासाठी दररोज किमान 30 मिनिटे व्यायाम करा.',
      description:
        'नियमित व्यायाम हृदय मजबूत करतो, रक्ताभिसरण सुधारतो, मूड वाढवतो आणि दीर्घकालीन आजारांचा धोका कमी करतो. कार्डिओ + स्ट्रेंथ ठेवा.',
    },
    {
      title: 'संतुलित आहार आणि नियमित व्यायामाने निरोगी वजन राखा.',
      description:
        'निरोगी वजनामुळे मधुमेह, हृदयविकार आणि सांधेदुखीचा धोका कमी होतो. झटपट उपायांपेक्षा टिकाऊ सवयींवर भर द्या.',
    },
    {
      title: 'संभाव्य समस्या लवकर ओळखण्यासाठी नियमित आरोग्य तपासणी करा.',
      description:
        'प्रतिबंधक तपासण्यांमुळे आजार सुरुवातीला आढळतात आणि उपचार प्रभावी ठरतात. वार्षिक तपासणी, स्क्रीनिंग आणि दंततपासणी आवश्यक आहेत.',
    },
    {
      title: 'ताण कमी करण्यासाठी आणि मानसिक स्पष्टतेसाठी निसर्गात वेळ घाला.',
      description:
        'निसर्गात वेळ घालवल्याने कॉर्टिसोल कमी होतो, चिंता घटते आणि मूड सुधारतो. फक्त 20 मिनिटे बाहेर राहिल्यानेही फायदा होतो.',
    },
    {
      title: 'चांगल्या झोपेसाठी विशेषतः दुपारनंतर कॅफीन कमी घ्या.',
      description:
        'कॅफीनचा प्रभाव 5-6 तास राहू शकतो. उशिरा घेतल्यास झोप बिघडते. 400mg/दिवस मर्यादा ठेवा आणि दुपारी 2 नंतर टाळा.',
    },
    {
      title: 'लवचिकता आणि मानसिक शांततेसाठी योग किंवा ध्यान करा.',
      description:
        'योगात हालचाल, श्वसन आणि ध्यान यांचा समावेश असतो. त्यामुळे ताण कमी होतो, लवचिकता वाढते आणि मन-शरीर समतोल सुधारतो.',
    },
  ],
}

const APPOINTMENT_COLORS = ['#45A191', '#4F46E5', '#EF4444', '#F59E0B', '#8B5CF6']

function dateKey(date) {
  return date.toISOString().split('T')[0]
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function localeForLanguage(language) {
  if (language === 'Hindi') return 'hi-IN'
  if (language === 'Marathi') return 'mr-IN'
  return 'en-IN'
}

function displayAppointmentSubtitle(subtitle, copy) {
  const value = String(subtitle || '').trim()
  if (!value) return copy.appointment

  const defaultLabels = new Set(['Appointment', 'भेंट', 'भेट'])
  return defaultLabels.has(value) ? copy.appointment : value
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { language, userName } = useApp()
  const copy = DASHBOARD_COPY[language] || DASHBOARD_COPY.English
  const locale = localeForLanguage(language)
  const healthTips = HEALTH_TIPS_BY_LANGUAGE[language] || HEALTH_TIPS_BY_LANGUAGE.English

  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [steps, setSteps] = useState(0)
  const [sleepDuration, setSleepDuration] = useState(0)
  const [distance, setDistance] = useState(0)
  const [heartRate, setHeartRate] = useState(0)

  const [stepsGoal, setStepsGoal] = useState(parseNumber(localStorage.getItem('stepsGoal'), 10000))
  const [sleepGoal, setSleepGoal] = useState(parseNumber(localStorage.getItem('sleepGoal'), 8))
  const [distanceGoal, setDistanceGoal] = useState(parseNumber(localStorage.getItem('distanceGoal'), 5000))

  const [appointments, setAppointments] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  const [goalModal, setGoalModal] = useState({ type: null, value: '' })
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    subtitle: '',
    date: dateKey(new Date()),
    time: '10:00',
    color: APPOINTMENT_COLORS[0],
  })

  const [tipIndex, setTipIndex] = useState(0)

  const healthScore = useMemo(() => {
    const score =
      (steps / stepsGoal) * 40 +
      (sleepDuration / sleepGoal) * 30 +
      (distance / distanceGoal) * 30
    return Math.max(0, Math.min(100, Math.round(score)))
  }, [steps, sleepDuration, distance, stepsGoal, sleepGoal, distanceGoal])

  const healthRemark = useMemo(() => {
    if (healthScore >= 90) return { label: copy.excellent, color: 'text-emerald-600', chip: 'bg-emerald-100' }
    if (healthScore >= 70) return { label: copy.good, color: 'text-brand', chip: 'bg-brand/15' }
    if (healthScore >= 50) return { label: copy.fair, color: 'text-amber-600', chip: 'bg-amber-100' }
    return { label: copy.needsAttention, color: 'text-red-500', chip: 'bg-red-100' }
  }, [healthScore, copy])

  const weeklyDays = useMemo(() => {
    const first = startOfWeek(new Date())
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(first)
      day.setDate(first.getDate() + index)
      return day
    })
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem('appointments')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setAppointments(parsed)
    } catch {
      setAppointments([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments))
  }, [appointments])

  useEffect(() => {
    setTipIndex(0)
  }, [language])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((index) => (index + 1) % healthTips.length)
    }, 30000)
    return () => clearInterval(interval)
  }, [healthTips.length])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setAppointments((previous) =>
        previous.filter((item) => {
          const dateTime = new Date(`${item.date}T${item.time}`).getTime()
          return now < dateTime + 24 * 60 * 60 * 1000
        }),
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchDataForDate(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  useEffect(() => {
    localStorage.setItem('stepsGoal', String(stepsGoal))
  }, [stepsGoal])

  useEffect(() => {
    localStorage.setItem('sleepGoal', String(sleepGoal))
  }, [sleepGoal])

  useEffect(() => {
    localStorage.setItem('distanceGoal', String(distanceGoal))
  }, [distanceGoal])

  async function fetchDataForDate(date) {
    setLoading(true)

    await syncStravaActivities()
    const result = await getHealthData(dateKey(date))

    if (result.success) {
      setIsOffline(result.cached === true)
      const data = result.data

      if (data) {
        const nextSteps = parseNumber(data.steps, 0)
        const nextSleep = parseNumber(data?.sleep?.duration, 0)
        const nextHeartRate = parseNumber(data.heartRateAvg, 0)
        const nextDistance = Math.round(nextSteps * 0.75)

        setSteps(nextSteps)
        setSleepDuration(nextSleep)
        setHeartRate(nextHeartRate)
        setDistance(nextDistance)

        const isToday = dateKey(date) === dateKey(new Date())
        if (isToday) {
          cacheHealthData({ steps: nextSteps, heartRate: nextHeartRate, sleepHours: nextSleep })
          checkHealthAndNotify({ steps: nextSteps, heartRate: nextHeartRate, sleepHours: nextSleep })
        }
      } else {
        setSteps(0)
        setSleepDuration(0)
        setHeartRate(0)
        setDistance(0)
      }
    }

    setLoading(false)
  }

  function openGoalModal(type) {
    if (type === 'steps') {
      setGoalModal({ type, value: String(stepsGoal) })
      return
    }
    if (type === 'sleep') {
      setGoalModal({ type, value: String(sleepGoal) })
      return
    }
    setGoalModal({ type, value: String(distanceGoal) })
  }

  function saveGoal() {
    const value = parseNumber(goalModal.value, 0)
    if (value <= 0) return

    if (goalModal.type === 'steps') {
      setStepsGoal(Math.round(value))
    } else if (goalModal.type === 'sleep') {
      setSleepGoal(Number(value.toFixed(1)))
    } else {
      setDistanceGoal(Math.round(value))
    }

    setGoalModal({ type: null, value: '' })
  }

  function addAppointment() {
    if (!appointmentForm.title.trim()) return

    setAppointments((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        title: appointmentForm.title,
        subtitle: appointmentForm.subtitle || copy.appointment,
        date: appointmentForm.date,
        time: appointmentForm.time,
        color: appointmentForm.color,
      },
    ])

    setShowAddModal(false)
    setAppointmentForm({
      title: '',
      subtitle: '',
      date: dateKey(new Date()),
      time: '10:00',
      color: APPOINTMENT_COLORS[0],
    })
  }

  const goalTargetLabel =
    goalModal.type === 'steps' ? copy.steps : goalModal.type === 'sleep' ? copy.sleep : copy.distance
  const goalUnitLabel =
    goalModal.type === 'steps' ? copy.stepsUnit : goalModal.type === 'sleep' ? copy.hoursUnit : copy.metersUnit

  return (
    <MainLayout
      title={t(language, 'dashboard')}
      onRefresh={() => fetchDataForDate(selectedDate)}
      headerMode="dashboard"
      showGamification
    >
      {isOffline ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-100/80 px-3 py-2 text-xs font-semibold text-amber-700">
          {copy.offline}
        </div>
      ) : null}

      {loading ? (
        <div className="card mt-2 p-10 text-center text-sm text-slate-500">{t(language, 'syncing')}</div>
      ) : (
        <>
          <section className="card mt-1 rounded-[28px] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-appMuted">{copy.hello}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{userName || copy.user}</h2>
              </div>
              <button
                className="flex h-12 w-12 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand"
                onClick={() => navigate('/profile')}
                title={copy.openProfile}
              >
                <UserRound size={22} />
              </button>
            </div>

            <div className="mx-auto mt-5 flex h-36 w-36 items-center justify-center rounded-full border-[6px] border-brand/20">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-[7px] border-brand/25">
                <div className="text-center">
                  <p className="text-5xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">{healthScore}</p>
                  <p className="text-xs font-semibold text-appMuted">/ 100</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-brand/25 bg-brand/10 p-4">
              <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{copy.healthScore}</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${healthRemark.chip} ${healthRemark.color}`}>
                {healthRemark.label}
              </span>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-appMuted">
                <Clock3 size={12} />
                {copy.lastUpdated} {new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </section>

          <section className="card mt-4 rounded-[22px] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-slate-900 dark:text-white">{copy.thisWeek}</p>
              <p className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                {selectedDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weeklyDays.map((day) => {
                const active = dateKey(day) === dateKey(selectedDate)
                const disabled = day > new Date()
                return (
                  <button
                    key={day.toISOString()}
                    disabled={disabled}
                    onClick={() => setSelectedDate(day)}
                    className={`rounded-xl px-1 py-2 text-center ${
                      active
                        ? 'bg-brand/95 text-white'
                        : 'bg-[#EDF1F4] text-appMuted dark:bg-slate-700 dark:text-slate-300'
                    } ${disabled ? 'opacity-45' : ''}`}
                  >
                    <div className="text-[24px] font-semibold leading-none">{day.getDate()}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                      {day.toLocaleDateString(locale, { weekday: 'short' })}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <StepsCard steps={steps} stepsGoal={stepsGoal} onEdit={() => openGoalModal('steps')} copy={copy} />
            <SleepCard
              sleepDuration={sleepDuration}
              sleepGoal={sleepGoal}
              onEdit={() => openGoalModal('sleep')}
              copy={copy}
            />
            <DistanceCard
              distance={distance}
              distanceGoal={distanceGoal}
              onEdit={() => openGoalModal('distance')}
              copy={copy}
            />
            <HeartCard heartRate={heartRate} copy={copy} />
          </section>

          <section className="mt-4 rounded-3xl bg-gradient-to-r from-[#16695D] to-[#0C5958] px-4 py-5 text-white shadow-soft">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-white/70">
              <Lightbulb size={12} />
              {copy.dailyHealthTip}
            </p>
            <p className="mt-2 text-lg leading-7 text-white/95">{healthTips[tipIndex]?.title}</p>
            <button
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
              onClick={() => setShowTipsModal(true)}
            >
              {copy.learnMore}
              <span aria-hidden>➜</span>
            </button>
          </section>

          <section className="mt-4 pb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{copy.upcomingAppointments}</h3>
              <button
                className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={12} />
                {copy.addAppointment}
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="card p-6 text-center text-sm text-appMuted">{copy.noUpcomingAppointments}</div>
            ) : (
              <div className="space-y-2">
                {[...appointments]
                  .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                  .map((item) => {
                    const appointmentDate = new Date(`${item.date}T${item.time}`)
                    const isElapsed = Date.now() > appointmentDate.getTime()
                    const day = appointmentDate.getDate()
                    const month = appointmentDate.toLocaleDateString(locale, { month: 'short' })

                    return (
                      <div
                        key={item.id}
                        className="card flex items-center gap-3 rounded-2xl px-3 py-3"
                      >
                        <div
                          className="flex h-14 w-14 flex-col items-center justify-center rounded-xl text-white"
                          style={{ background: item.color }}
                        >
                          <span className="text-lg font-bold leading-none">{day}</span>
                          <span className="text-[10px] font-semibold uppercase text-white/80">{month}</span>
                        </div>

                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              isElapsed
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.time} · {item.title}
                          </p>
                          <p className="text-xs text-appMuted">{displayAppointmentSubtitle(item.subtitle, copy)}</p>
                        </div>

                        {isElapsed ? (
                          <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                            {copy.elapsed}
                          </span>
                        ) : null}

                        <button
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if (!window.confirm(copy.deleteConfirm)) return
                            setAppointments((prev) => prev.filter((p) => p.id !== item.id))
                          }}
                          title={copy.deleteAppointment}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        </>
      )}

      {showTipsModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-4 shadow-card dark:bg-slate-800">
            <h4 className="mb-3 flex items-center justify-center gap-1 text-[28px] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              <Lightbulb size={16} className="text-amber-500" />
              {copy.allHealthTips}
            </h4>

            <div className="max-h-[54vh] space-y-3 overflow-y-auto pr-1">
              {healthTips.map((tip, index) => (
                <div key={tip.title} className="rounded-xl border border-appStroke bg-[#F8FAFB] p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand/90 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tip.title}</p>
                      <p className="mt-2 text-xs leading-5 text-appMuted dark:text-slate-300">{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-slate-900"
              onClick={() => setShowTipsModal(false)}
            >
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}

      {goalModal.type ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-card dark:bg-slate-800">
            <h4 className="text-[46px] font-semibold leading-[0.95] tracking-[-0.05em] text-slate-900 dark:text-white">
              {copy.set} {goalTargetLabel} {copy.goal}
            </h4>
            <div className="relative mt-4">
              <input
                value={goalModal.value}
                onChange={(event) => setGoalModal((previous) => ({ ...previous, value: event.target.value }))}
                type="number"
                className="auth-input h-14 rounded-2xl pr-20 text-xl"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-appMuted">
                {goalUnitLabel}
              </span>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-appMuted dark:bg-slate-700"
                onClick={() => setGoalModal({ type: null, value: '' })}
              >
                {copy.cancel}
              </button>
              <button className="rounded-xl bg-brand px-6 py-2 text-sm font-semibold text-slate-900" onClick={saveGoal}>
                {copy.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-800">
            <h4 className="text-lg font-bold">{copy.addAppointmentTitle}</h4>
            <div className="mt-4 space-y-3">
              <input
                className="auth-input"
                placeholder={copy.titlePlaceholder}
                value={appointmentForm.title}
                onChange={(e) => setAppointmentForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                className="auth-input"
                placeholder={copy.descriptionPlaceholder}
                value={appointmentForm.subtitle}
                onChange={(e) => setAppointmentForm((p) => ({ ...p, subtitle: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="auth-input"
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm((p) => ({ ...p, date: e.target.value }))}
                />
                <input
                  className="auth-input"
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                {APPOINTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full border-2 ${appointmentForm.color === color ? 'border-black dark:border-white' : 'border-transparent'}`}
                    style={{ background: color }}
                    onClick={() => setAppointmentForm((p) => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg px-4 py-2 text-sm" onClick={() => setShowAddModal(false)}>
                {copy.cancel}
              </button>
              <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={addAppointment}>
                {copy.add}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  )
}

function StepsCard({ steps, stepsGoal, onEdit, copy }) {
  const progress = stepsGoal > 0 ? Math.min(1, steps / stepsGoal) : 0
  const percent = Math.round(progress * 100)
  const bars = [0.32, 0.48, 0.36, 0.58, 0.44, 0.66, 0.72, 0.52]

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <Footprints size={16} />
        </span>
        <div className="flex items-center gap-2 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600">
          {percent}% {copy.of} {stepsGoal >= 1000 ? `${(stepsGoal / 1000).toFixed(stepsGoal % 1000 === 0 ? 0 : 1)}k` : stepsGoal}
          <button className="text-orange-600" onClick={onEdit} title={copy.editStepsGoal}>
            <Pencil size={12} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex h-16 items-end gap-3">
        {bars.map((value, index) => (
          <div key={index} className="h-full flex-1 rounded-full bg-orange-100/60">
            <div
              className="rounded-full bg-orange-500/75"
              style={{ height: `${Math.max(8, Math.round((value * 40 + progress * 60)))}%` }}
            />
          </div>
        ))}
      </div>

      <p className="mt-3 text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">
        {steps.toLocaleString()}
      </p>
      <p className="text-sm text-appMuted">{copy.steps}</p>
    </div>
  )
}

function SleepCard({ sleepDuration, sleepGoal, onEdit, copy }) {
  const progress = sleepGoal > 0 ? Math.min(1, sleepDuration / sleepGoal) : 0
  const percent = Math.round(progress * 100)
  const wholeHours = Math.floor(sleepDuration)
  const minutes = Math.round((sleepDuration % 1) * 60)

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <BedDouble size={16} />
        </span>
        <div className="flex items-center gap-2 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600">
          {percent}% {copy.of} {sleepGoal}{copy.hoursShort}
          <button className="text-indigo-600" onClick={onEdit} title={copy.editSleepGoal}>
            <Pencil size={12} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-16 w-full">
        <svg width="100%" height="100%" viewBox="0 0 314 56" preserveAspectRatio="none">
          <path
            d="M0 42 C30 34, 60 40, 90 30 C120 22, 150 32, 180 24 C210 18, 240 32, 270 26 C290 22, 304 24, 314 22"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="mt-3 text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">
        {wholeHours}{copy.hoursShort} {minutes}{copy.minutesShort}
      </p>
      <p className="text-sm text-appMuted">{copy.sleep}</p>
    </div>
  )
}

function DistanceCard({ distance, distanceGoal, onEdit, copy }) {
  const progress = distanceGoal > 0 ? Math.min(1, distance / distanceGoal) : 0
  const goalText = `${Math.round(progress * 100)}% ${copy.of} ${(distanceGoal / 1000).toFixed(distanceGoal % 1000 === 0 ? 0 : 1)}km`
  const bars = [0.22, 0.36, 0.44, 0.52, 0.62, 0.74, 0.84]

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-brand">
          <RouteIcon size={16} />
        </span>
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-brand">
          {goalText}
          <button className="text-brand" onClick={onEdit} title={copy.editDistanceGoal}>
            <Pencil size={12} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex h-16 items-end gap-4">
        {bars.map((value, index) => (
          <div key={index} className="h-full flex-1">
            <div
              className="rounded-full bg-brand/70"
              style={{ height: `${Math.max(4, Math.round((progress + value) * 26))}%` }}
            />
          </div>
        ))}
      </div>

      <p className="mt-3 text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">{distance.toLocaleString()}m</p>
      <p className="text-sm text-appMuted">{copy.distance}</p>
    </div>
  )
}

function HeartCard({ heartRate, copy }) {
  const points = '0,42 30,42 55,40 76,44 98,20 118,46 140,43 162,41 185,45 207,39 230,43 252,42 274,44 314,42'
  const label = heartRate > 0 ? (heartRate < 60 ? copy.low : heartRate > 100 ? copy.high : copy.normal) : '--'
  const labelTone = heartRate > 100 ? 'text-red-500 bg-red-100' : heartRate > 0 && heartRate < 60 ? 'text-sky-600 bg-sky-100' : 'text-emerald-600 bg-emerald-100'

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <HeartPulse size={16} />
        </span>
        <div className={`rounded-md px-2 py-1 text-[11px] font-semibold ${labelTone}`}>{label}</div>
      </div>

      <div className="mt-3 h-16 w-full">
        <svg width="100%" height="100%" viewBox="0 0 314 56" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#9F1239"
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="mt-3 text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">{heartRate || 0}</p>
      <p className="text-sm text-appMuted">{copy.bpm}</p>
    </div>
  )
}
