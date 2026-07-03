-- ============================================================================
-- Miracle Natural — product catalog seed
--
-- Run this AFTER schema.sql. Safe to re-run (upserts by id).
-- Mirrors src/data/productCatalog.js as of the current site content.
--
-- Note: image_url is left NULL for now. The frontend currently renders
-- product images from local bundled assets (src/assets/catalog/...), not
-- from this table. Uploading them to Supabase Storage and filling in
-- image_url is a good follow-up once you're ready to drive the Shop page
-- from this table instead of the hardcoded productCatalog.js file.
-- ============================================================================

insert into public.products (id, name, category, size, price, description, ingredients, benefits)
values
  ('golden-glow-face-wash', 'Golden Glow Face Wash', 'Face Care', '100ml', 850,
   'Daily face wash designed to deeply cleanse while maintaining moisture balance for a natural glow.',
   'Harankaha, Aloe Vera, Manjishta, Thulsi, Herbal Blend',
   'Deep cleanse, removes dead cells, reduces spots, helps prevent pimples, balances pH, brightens and moisturizes.'),

  ('golden-glow-day-gel', 'Golden Glow Day Gel', 'Face Care', '30g', 1950,
   'Lightweight daytime gel that hydrates and soothes without a greasy feel.',
   'Saffron, Manjishta, Licorice, Aloe Vera, Niacinamide, Herbal Blend',
   'Controls oil, non-greasy hydration, soothes skin, makeup-friendly base, suitable for sensitive skin.'),

  ('golden-glow-serum-24k', '24K Golden Glow Serum', 'Treatment', '20ml', 1450,
   'Concentrated serum formulated for visible tone correction and skin repair.',
   'Hyaluronic Acid, Refined Glycerin, Kojic Acid, Velmadata Extract, Turmeric Extract, Savandara Extract, Gold Extract, Welmee Extract',
   'Anti-wrinkle support, reduces dark spots and pigmentation, lightens tone, reduces acne marks, intense repair.'),

  ('golden-glow-night-cream', 'Golden Glow Night Cream', 'Face Care', '30g', 2450,
   'Night cream for overnight hydration, brightening, and skin recovery support.',
   'Licorice, Harankaha, Saffron, Alpha Arbutin, Vitamin C, Almond Oil, Vitamin E, Gold Extract, Manjishta',
   'Brightens skin, fades dark spots and pigmentation, moisturizes, softens, hydrates, supports overnight repair.'),

  ('acne-treatment-gel', 'Tea Tree Acne Treatment Gel', 'Treatment', '30g', 1950,
   'Targeted acne care gel focused on oil control and pimple reduction.',
   'Tea Tree, Neem, Aloe Vera, Harankaha, Coriander',
   'Treats pimples, controls excess oil, helps maintain skin pH, suitable for oily and combination skin, smoother feel.'),

  ('herbal-face-treatment-pack', 'Herbal Face Treatment Pack', 'Weekly Care', '100g', 2250,
   'Weekly treatment pack for glow support, tan reduction, and skin tone improvement.',
   'Rice Flour, Sandalwood, Gram Flour, Multani Mitti, Vitamin C, Manjishta',
   'Instant glow, helps remove suntan, anti-aging support, reduces fine lines and wrinkles, helps lighten scars, brightens and evens tone.'),

  ('herbal-face-treatment-scrub', 'Herbal Face Treatment Scrub', 'Weekly Care', '100g', 2250,
   'Exfoliating face scrub formulated to refresh texture and support clearer skin.',
   'Aloe Vera, Neem, Cinnamon, Sandalwood, Lemon, Harankaha, Manjishta, Bee Honey',
   'Exfoliates dead cells, improves texture, fades marks, helps fight and prevent acne and blackheads, soothing and rejuvenating.'),

  ('golden-glow-body-lotion', 'Golden Glow Body Lotion', 'Body Care', '250ml', 2750,
   'Body lotion focused on deep moisture and visible tone evening.',
   'Sandalwood, Alpha Arbutin, Niacinamide, Vitamin C, Manjishta',
   'Deep moisturization, smoother texture, protects against dryness, helps fade dark patches, brightens and evens tone.'),

  ('calm-sandalwood-herbal-bar', 'Calm Sandalwood Herbal Bar', 'Body Care', '70g', 100,
   'Miracle Natural Sandalwood Soap is made with a traditional soap base and Vitamin E, enriched with sandalwood and sandalwood oil for gentle daily cleansing. Known for its calming fragrance and refreshing feel.',
   'Herbal Additives: Sandalwood, Sandalwood Oil. Base Ingredients: Sodium Palmate, Sodium Palm Kernelate, CBP, Glycerin, Talc, EDTA, Vitamin E.',
   'Fragrance Profile: Warm, woody. Suitable For: All skin types. Key Features: Herbal-inspired formulation, enriched with Vitamin E, gentle everyday cleansing, suitable for daily use, inspired by traditional herbal knowledge. Directions: Lather with water, apply to wet skin, and rinse thoroughly. Safety: For external use only. Avoid contact with eyes.'),

  ('purifying-moringa-herbal-bar', 'Purifying Moringa Herbal Bar', 'Body Care', '70g', 100,
   'Miracle Natural Moringa Soap is made with a traditional soap base and Vitamin E, enriched with moringa powder and moringa oil for gentle daily cleansing. Rich in plant nutrients and helps keep skin feeling fresh.',
   'Herbal Additives: Moringa Powder, Moringa Oil. Base Ingredients: Sodium Palmate, Sodium Palm Kernelate, CBP, Glycerin, Talc, EDTA, Vitamin E.',
   'Fragrance Profile: Clean, natural herbal. Suitable For: All skin types. Key Features: Herbal-inspired formulation, enriched with Vitamin E, gentle everyday cleansing, suitable for daily use, inspired by traditional herbal knowledge. Directions: Lather with water, apply to wet skin, and rinse thoroughly. Safety: For external use only. Avoid contact with eyes.'),

  ('comfort-cinnamon-herbal-bar', 'Comfort Cinnamon Herbal Bar', 'Body Care', '70g', 100,
   'Miracle Natural Cinnamon Soap is made with a traditional soap base and Vitamin E, enriched with cinnamon powder and cinnamon bark oil for gentle daily cleansing. Offers a warm, spicy aroma with a gently cleansing feel.',
   'Herbal Additives: Cinnamon Powder, Cinnamon Bark Oil. Base Ingredients: Sodium Palmate, Sodium Palm Kernelate, CBP, Glycerin, Talc, EDTA, Vitamin E.',
   'Fragrance Profile: Warm and spicy. Suitable For: All skin types. Key Features: Herbal-inspired formulation, enriched with Vitamin E, gentle everyday cleansing, suitable for daily use, inspired by traditional herbal knowledge. Directions: Lather with water, apply to wet skin, and rinse thoroughly. Safety: For external use only. Avoid contact with eyes.'),

  ('detox-venivel-herbal-bar', 'Detox Venivel Herbal Bar', 'Body Care', '70g', 100,
   'Miracle Natural Venivel Geta Soap is made with a traditional soap base and Vitamin E, enriched with venivel geta and venivel geta oil for gentle daily cleansing. Traditionally valued herbal ingredient used in skin cleansing.',
   'Herbal Additives: Venivel Geta, Venivel Geta Oil. Base Ingredients: Sodium Palmate, Sodium Palm Kernelate, CBP, Glycerin, Talc, EDTA, Vitamin E.',
   'Fragrance Profile: Mild, earthy herbal. Suitable For: All skin types. Key Features: Herbal-inspired formulation, enriched with Vitamin E, gentle everyday cleansing, suitable for daily use, inspired by traditional herbal knowledge. Directions: Lather with water, apply to wet skin, and rinse thoroughly. Safety: For external use only. Avoid contact with eyes.'),

  ('golden-turmeric-herbal-bar', 'Golden Turmeric Herbal Bar', 'Body Care', '70g', 100,
   'Miracle Natural Turmeric Soap is made with a traditional soap base and Vitamin E, enriched with turmeric and turmeric oil for gentle daily cleansing. Traditionally valued for improving skin appearance and radiance.',
   'Herbal Additives: Turmeric, Turmeric Oil. Base Ingredients: Sodium Palmate, Sodium Palm Kernelate, CBP, Glycerin, Talc, EDTA, Vitamin E.',
   'Fragrance Profile: Mild herbal. Suitable For: All skin types. Key Features: Herbal-inspired formulation, enriched with Vitamin E, gentle everyday cleansing, suitable for daily use, inspired by traditional herbal knowledge. Directions: Lather with water, apply to wet skin, and rinse thoroughly. Safety: For external use only. Avoid contact with eyes.'),

  ('herbal-shampoo', 'Herbal Shampoo', 'Hair Care', '250ml', 1550,
   'Herbal shampoo blend designed for scalp care and hair-strength support.',
   'Cinnamon, Neem, Vitamin E, Aloe Vera, Carrot Oil, Amla, Black Pepper, Karapincha, Gotukola, Kaluduru, Kaluthala, Almond Oil',
   'Treats dandruff, helps repair roots, reduces hair fall, adds volume, supports complete hair treatment.'),

  ('herbal-conditioner', 'Herbal Conditioner', 'Hair Care', '250ml', 1550,
   'Conditioner for softness, repair, and better manageability.',
   'Godapara, Aloe Vera, Cinnamon, Neem, Vitamin E Oil, Carrot Oil, Amla, Black Pepper, Thulsi, Karapincha, Gotukola, Kaluduru, Kaluthala, Almond Oil',
   'Helps keep hair shiny, soft, and smoother, repairs damage and flyaways, nourishes and adds volume.'),

  ('hair-oil-set-50ml', 'Hair Oil Set', 'Hair Care', '50ml x 3', 1950,
   '3-in-1 botanical oil set for regular scalp and hair nourishment.',
   'Includes Herbal Oil, Aloe Vera Oil, and Neem Oil (35+ botanicals across the set)',
   'Promotes growth, reduces thinning, fights damage and frizz, helps prevent premature greying, relieves tension, improves scalp health.'),

  ('hair-oil-set-200ml', 'Hair Oil Set', 'Hair Care', '200ml x 3', 4950,
   '3-in-1 botanical oil set in larger volume for long-term routine use.',
   'Includes Herbal Oil, Aloe Vera Oil, and Neem Oil (35+ botanicals across the set)',
   'Promotes growth, reduces thinning, fights damage and frizz, helps prevent premature greying, relieves tension, improves scalp health.'),

  ('under-eye-gel', 'Under Eye Gel', 'Treatment', '20ml', 1450,
   'Cooling under-eye gel for dark-circle care and delicate area hydration.',
   'Aloe Vera, Cucumber, Potato, Jojoba Oil, Almond Oil',
   'Targets dark circles, protects delicate under-eye skin, smooths wrinkles and fine lines, provides cooling hydration.'),

  ('pink-rose-lip-balm', 'Pink Rose Lip Balm', 'Lip Care', '15g', 950,
   'Nourishing lip balm to soften dry lips and add a soft rosy tone.',
   'Shea Butter, Almond Oil, Bee Honey, Vitamin E, Strawberry Extract, Olive Oil, Castor Oil, Beeswax',
   'Great for dry and pigmented lips, soft and luscious feel, child-friendly, suitable during pregnancy, adds a soft rosy tone.')

on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  size = excluded.size,
  price = excluded.price,
  description = excluded.description,
  ingredients = excluded.ingredients,
  benefits = excluded.benefits,
  updated_at = now();
