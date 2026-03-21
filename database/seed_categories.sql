-- ================================================================
-- database/seed_categories.sql — Job Category Seed Data
-- All 12 categories in English, Marathi, Hindi, Gujarati
-- Author: Digital Kaam Naka Dev Team
-- ================================================================

INSERT INTO categories (name_en, name_mr, name_hi, name_gu, icon_emoji, description_mr, sort_order) VALUES
('Construction Work',   'बांधकाम',          'निर्माण कार्य',      'બાંધકામ',       '🧱', 'घर, रस्ता, इमारत बांधणी संबंधित काम',         1),
('Farming Work',        'शेतीकाम',          'खेती का काम',       'ખેતીકામ',       '🌾', 'शेत नांगरणे, पेरणी, काढणी इ. कामे',           2),
('Household Work',      'घरकाम',            'घर का काम',         'ઘરકામ',         '🏠', 'घर साफसफाई, स्वयंपाक, बागकाम',               3),
('Loading / Unloading', 'माल चढवणे/उतरवणे', 'माल लोडिंग/अनलोडिंग', 'માલ ચઢ/ઉતર',    '📦', 'ट्रक, गोदाम, दुकानात माल हाताळणी',           4),
('Painting',            'रंगकाम',           'पेंटिंग का काम',    'રંગકામ',        '🎨', 'घर, दुकान, इमारतींना रंग देणे',               5),
('Plumbing',            'प्लंबिंग',          'नलसाज़ी',           'પ્લમ્બિંગ',      '🔧', 'पाईप, नळ, टाकी दुरुस्ती व बसवणे',            6),
('Electrical Work',     'विद्युत काम',       'बिजली का काम',      'વિદ્યુત કામ',    '⚡', 'वायरिंग, फिटिंग, दुरुस्ती',                   7),
('Security / Watchman', 'सुरक्षारक्षक',       'सुरक्षा गार्ड',     'સુરક્ષારક્ષક',  '💂', 'सोसायटी, दुकान, गोदाम सुरक्षा',              8),
('Event Work',          'कार्यक्रम काम',     'इवेंट वर्क',        'ઇવેન્ટ કામ',    '🎪', 'लग्न, समारंभ, उत्सव येथे काम',              9),
('Cleaning / Sweeping', 'सफाई काम',          'सफाई का काम',       'સફાઈ કામ',      '🧹', 'ऑफिस, सोसायटी, रस्ता सफाई',                 10),
('Driving',             'वाहन चालवणे',       'वाहन चलाना',        'વાહન ચલાવવું',  '🚛', 'ट्रक, टेम्पो, टॅक्सी चालवणे',               11),
('Other Work',          'इतर काम',          'अन्य काम',          'અન્ય કામ',      '💼', 'वरील प्रकारांत न मोडणारी इतर कामे',           12);

-- ================================================================
-- database/seed_locations.sql — Maharashtra Districts & Cities
-- ================================================================

INSERT INTO locations (state, district, taluka, city, latitude, longitude) VALUES
-- Pune Division
('Maharashtra', 'Pune',        'Haveli',       'Pune',         18.5204, 73.8567),
('Maharashtra', 'Pune',        'Maval',        'Lonavala',     18.7481, 73.4072),
('Maharashtra', 'Pune',        'Mulshi',       'Pirangut',     18.5196, 73.6295),
('Maharashtra', 'Pune',        'Khed',         'Rajgurunagar', 18.9879, 73.9004),
('Maharashtra', 'Solapur',     'Solapur',      'Solapur',      17.6868, 75.9064),
('Maharashtra', 'Satara',      'Satara',       'Satara',       17.6805, 74.0183),
('Maharashtra', 'Sangli',      'Miraj',        'Sangli',       16.8524, 74.5815),
('Maharashtra', 'Kolhapur',    'Kolhapur',     'Kolhapur',     16.7050, 74.2433),
-- Mumbai Division
('Maharashtra', 'Mumbai',      'Mumbai City',  'Mumbai',       19.0760, 72.8777),
('Maharashtra', 'Mumbai',      'Andheri',      'Andheri',      19.1136, 72.8697),
('Maharashtra', 'Thane',       'Thane',        'Thane',        19.2183, 72.9781),
('Maharashtra', 'Thane',       'Kalyan',       'Kalyan',       19.2437, 73.1355),
('Maharashtra', 'Raigad',      'Panvel',       'Panvel',       18.9894, 73.1175),
('Maharashtra', 'Ratnagiri',   'Ratnagiri',    'Ratnagiri',    16.9944, 73.3001),
-- Nashik Division
('Maharashtra', 'Nashik',      'Nashik',       'Nashik',       19.9975, 73.7898),
('Maharashtra', 'Nashik',      'Malegaon',     'Malegaon',     20.5579, 74.5089),
('Maharashtra', 'Ahmednagar',  'Ahmednagar',   'Ahmednagar',   19.0948, 74.7480),
('Maharashtra', 'Dhule',       'Dhule',        'Dhule',        20.9042, 74.7749),
('Maharashtra', 'Jalgaon',     'Jalgaon',      'Jalgaon',      21.0077, 75.5626),
-- Aurangabad/Chhatrapati Sambhajinagar Division
('Maharashtra', 'Aurangabad',  'Aurangabad',   'Aurangabad',   19.8762, 75.3433),
('Maharashtra', 'Aurangabad',  'Paithan',      'Paithan',      19.4750, 75.3854),
('Maharashtra', 'Jalna',       'Jalna',        'Jalna',        19.8347, 75.8816),
('Maharashtra', 'Beed',        'Beed',         'Beed',         18.9890, 75.7601),
('Maharashtra', 'Latur',       'Latur',        'Latur',        18.3956, 76.5604),
('Maharashtra', 'Osmanabad',   'Osmanabad',    'Osmanabad',    18.1857, 76.0400),
('Maharashtra', 'Nanded',      'Nanded',       'Nanded',       19.1583, 77.3210),
-- Amravati Division
('Maharashtra', 'Amravati',    'Amravati',     'Amravati',     20.9333, 77.7500),
('Maharashtra', 'Akola',       'Akola',        'Akola',        20.7096, 77.0011),
('Maharashtra', 'Yavatmal',    'Yavatmal',     'Yavatmal',     20.3980, 78.1198),
('Maharashtra', 'Washim',      'Washim',       'Washim',       20.1101, 77.1348),
-- Nagpur Division
('Maharashtra', 'Nagpur',      'Nagpur',       'Nagpur',       21.1458, 79.0882),
('Maharashtra', 'Wardha',      'Wardha',       'Wardha',       20.7453, 78.6022),
('Maharashtra', 'Bhandara',    'Bhandara',     'Bhandara',     21.1666, 79.6498),
('Maharashtra', 'Gondia',      'Gondia',       'Gondia',       21.4611, 80.1951),
('Maharashtra', 'Chandrapur',  'Chandrapur',   'Chandrapur',   19.9615, 79.2961),
('Maharashtra', 'Gadchiroli',  'Gadchiroli',   'Gadchiroli',   20.1809, 80.0011);
