-- Auto Reply Data Initialization Script for Saby Shop Chat Support

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'price', 'PRICING', 
       'ជម្រាបសួរ! តម្លៃផលិតផល និងការបញ្ចុះតម្លៃទាំងអស់ត្រូវបានបង្ហាញនៅលើទំព័រផលិតផល។ លោកអ្នកអាចចូលមើលតម្លៃចុងក្រោយ និងប្រូម៉ូសិនពិសេសៗនៅទីនោះបាន!', 
       'Hello! All product prices and discounts are displayed on the product page. You can check out our website for the latest prices and special deals!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'price');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'តម្លៃ', 'PRICING', 
       'ជម្រាបសួរ! តម្លៃផលិតផល និងការបញ្ចុះតម្លៃទាំងអស់ត្រូវបានបង្ហាញនៅលើទំព័រផលិតផល។ លោកអ្នកអាចចូលមើលតម្លៃចុងក្រោយ និងប្រូម៉ូសិនពិសេសៗនៅទីនោះបាន!', 
       'Hello! All product prices and discounts are displayed on the product page. You can check out our website for the latest prices and special deals!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'តម្លៃ');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'payment', 'PAYMENT', 
       'ជម្រាបសួរ! ហាងយើងខ្ញុំទទួលការទូទាត់តាមរយៈ KHQR, Bakong និងការផ្ទេរតាមធនាគារ (ABA, ACLEDA, Wing)។ បន្ទាប់ពីទូទាត់រួច គណនីនឹងត្រូវផ្ញើជូនលោកអ្នកភ្លាមៗ!', 
       'Hello! We accept payments via KHQR, Bakong, and Bank Transfers (ABA, ACLEDA, Wing). Credentials will be delivered instantly after payment verification!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'payment');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'ទូទាត់', 'PAYMENT', 
       'ជម្រាបសួរ! ហាងយើងខ្ញុំទទួលការទូទាត់តាមរយៈ KHQR, Bakong និងការផ្ទេរតាមធនាគារ (ABA, ACLEDA, Wing)។ បន្ទាប់ពីទូទាត់រួច គណនីនឹងត្រូវផ្ញើជូនលោកអ្នកភ្លាមៗ!', 
       'Hello! We accept payments via KHQR, Bakong, and Bank Transfers (ABA, ACLEDA, Wing). Credentials will be delivered instantly after payment verification!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'ទូទាត់');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'delivery', 'DELIVERY', 
       'ជម្រាបសួរ! គណនី និងលេខកូដទាំងអស់នឹងត្រូវផ្ញើជូនតាមអ៊ីមែល និងបង្ហាញនៅលើទំព័រប្រវត្តិការបញ្ជាទិញ (Order History) របស់លោកអ្នកភ្លាមៗដោយស្វ័យប្រវត្តិ!', 
       'Hello! All account credentials will be sent instantly to your email and displayed in your Order History automatically!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'delivery');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'help', 'SUPPORT', 
       'ជម្រាបសួរ! តើ Saby Shop អាចជួយសម្រួលអ្វីជូនលោកអ្នកបានទេ? សូមប្រាប់ពីបញ្ហា ឬសំណួររបស់លោកអ្នក ក្រុមការងារយើងខ្ញុំនឹងជួយសម្រួលជូនភ្លាមៗ!', 
       'Hello! How can Saby Shop assist you today? Please describe your issue or question, and our team will help you shortly!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'help');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'សួស្ដី', 'SUPPORT', 
       'ជម្រាបសួរ! តើ Saby Shop អាចជួយសម្រួលអ្វីជូនលោកអ្នកបានទេ? សូមប្រាប់ពីបញ្ហា ឬសំណួររបស់លោកអ្នក ក្រុមការងារយើងខ្ញុំនឹងជួយសម្រួលជូនភ្លាមៗ!', 
       'Hello! How can Saby Shop assist you today? Please describe your issue or question, and our team will help you shortly!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'សួស្ដី');

INSERT INTO auto_reply (keyword, category, reply_kh, reply_en)
SELECT 'netflix', 'PRODUCT', 
       'ចំពោះ Netflix Premium ផ្តល់ជូនការទស្សនាកម្រិត 4K Ultra HD យ៉ាងច្បាស់ និងមានការធានាដោះដូរជូនភ្លាមៗក្នុងរយៈពេលប្រើប្រាស់!', 
       'Our Netflix Premium offers 4K Ultra HD streaming with instant replacement warranty during your active subscription period!'
WHERE NOT EXISTS (SELECT 1 FROM auto_reply WHERE LOWER(keyword) = 'netflix');

-- Migration script to update existing admin email in PostgreSQL users table
UPDATE users 
SET email = 'korbsameth.dev@gmail.com' 
WHERE role = 'ADMIN' AND (email = 'admin@store.com' OR email = 'admin@example.com');

-- Migration scripts for stock_count and quantity
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0;
UPDATE products SET stock_count = 0 WHERE stock_count IS NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
UPDATE order_items SET quantity = 1 WHERE quantity IS NULL;

-- Migration script for chat_messages target_email
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS target_email VARCHAR(255);

-- Migration script for users has_used_free_trial
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_free_trial BOOLEAN DEFAULT FALSE;
UPDATE users SET has_used_free_trial = FALSE WHERE has_used_free_trial IS NULL;
