-- SAMPLE DATA: a fictional clinic for demos. Prices, address and phone are made up.
-- Its fixed id goes in .env.local as CLINIC_ID.
insert into clinics (id, name, hours, services, insurers, faq, phone, address, maps_url) values (
  '00000000-0000-0000-0000-000000000001',
  'Sample Smile Dental (sample data)',
  '{
    "sat": [["09:00","13:00"],["16:00","21:00"]],
    "sun": [["09:00","13:00"],["16:00","21:00"]],
    "mon": [["09:00","13:00"],["16:00","21:00"]],
    "tue": [["09:00","13:00"],["16:00","21:00"]],
    "wed": [["09:00","13:00"],["16:00","21:00"]],
    "thu": [["09:00","13:00"],["16:00","21:00"]],
    "fri": [["16:00","21:00"]]
  }',
  '[
    {"name":"Check-up and consultation","name_ar":"فحص واستشارة","minutes":30,"price_aed":150},
    {"name":"Scaling and polishing","name_ar":"تنظيف وتلميع الأسنان","minutes":45,"price_aed":300},
    {"name":"Filling","name_ar":"حشوة","minutes":45,"price_aed":350},
    {"name":"Toothache visit","name_ar":"زيارة ألم الأسنان","minutes":30,"price_aed":200},
    {"name":"Teeth whitening","name_ar":"تبييض الأسنان","minutes":60,"price_aed":1200}
  ]',
  '{Daman,AXA,NextCare}',
  '[
    {"q":"Parking","a":"Free parking in the building basement."},
    {"q":"Payment","a":"Cash, card and Apple Pay."},
    {"q":"Children","a":"We see children from age 3."},
    {"q":"Cancellation","a":"Please cancel or reschedule at least 4 hours before your visit."}
  ]',
  '+971 4 000 0000 (sample)',
  'Sample address, Al Barsha, Dubai (sample data)',
  null
);
