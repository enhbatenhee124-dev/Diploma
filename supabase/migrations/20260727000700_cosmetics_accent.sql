-- Мэндчилгээ дээр дарж сонгодог интерфэйсийн үндсэн өнгө.
-- Профайлын THEMES-ээс тусдаа: түвшингээс хамаарахгүй, зүгээр л амтын сонголт.
alter table public.cosmetics add column if not exists accent_id text;
