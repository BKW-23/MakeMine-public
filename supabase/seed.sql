-- Seed sản phẩm mẫu. KHÔNG insert vào auth.users hay public.profiles ở đây.
-- Sau khi có user thật (đăng ký qua Supabase Auth), nâng quyền admin bằng:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'EMAIL_CUA_BAN');

insert into public.products (name, slug, category, base_price, short_description, image_url, customizable, colors, fonts, featured, stock) values
('Lược bỏ túi mini', 'luoc-bo-tui-mini', 'lược', 69000, 'Lược nhỏ tiện mang theo, khắc tên', '/sample-product.png', true, array['hồng'], array['Quicksand'], true, 45)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  base_price = excluded.base_price,
  short_description = excluded.short_description,
  image_url = excluded.image_url,
  customizable = excluded.customizable,
  colors = excluded.colors,
  fonts = excluded.fonts,
  featured = excluded.featured,
  stock = excluded.stock;

insert into public.products (name, slug, category, base_price, short_description, image_url, customizable, colors, fonts, featured, stock) values
('Kẹp tóc chữ nổi', 'kep-toc-chu-noi', 'kẹp tóc', 69000, 'Kẹp tóc trong suốt cá nhân hóa với chữ nổi', '/products/kep-toc-chu-noi.jpg', true, array['hồng'], array['Script', 'Quicksand'], true, 30),
('Kẹp tóc ngọc trai', 'kep-toc-ngoc-trai', 'kẹp tóc', 69000, 'Kẹp tóc ngọc trai khắc tên nhẹ nhàng', '/products/kep-toc-ngoc-trai.jpg', true, array['hồng', 'trắng'], array['Script', 'Quicksand'], true, 30),
('Kẹp tóc hoa', 'kep-toc-hoa', 'kẹp tóc', 69000, 'Kẹp tóc hoa cá nhân hóa đáng yêu', '/products/kep-toc-hoa.jpg', true, array['hồng', 'tím'], array['Script', 'Quicksand'], true, 30),
('Gương cầm tay lấp lánh', 'guong-cam-tay-lap-lanh', 'gương', 69000, 'Gương cầm tay lấp lánh khắc tên riêng', '/products/guong-cam-tay-lap-lanh.jpg', true, array['hồng', 'tím'], array['Script', 'Quicksand'], true, 30),
('Lược ngọc trai', 'luoc-ngoc-trai', 'lược', 69000, 'Lược ngọc trai khắc tên theo yêu cầu', '/products/luoc-ngoc-trai.jpg', true, array['trắng'], array['Script', 'Quicksand'], true, 30)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  base_price = excluded.base_price,
  short_description = excluded.short_description,
  image_url = excluded.image_url,
  customizable = excluded.customizable,
  colors = excluded.colors,
  fonts = excluded.fonts,
  featured = excluded.featured,
  stock = excluded.stock;

insert into public.products (name, slug, category, base_price, short_description, image_url, customizable, colors, fonts, featured, stock) values
('Kẹp tóc cá nhân hóa', 'kep-toc-ca-nhan-hoa', 'kẹp tóc', 69000, 'Kẹp tóc cá nhân hóa, khắc tên theo yêu cầu', '/sample-product.png', true, array['hồng'], array['Quicksand'], true, 45)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  base_price = excluded.base_price,
  short_description = excluded.short_description,
  image_url = excluded.image_url,
  customizable = excluded.customizable,
  colors = excluded.colors,
  fonts = excluded.fonts,
  featured = excluded.featured,
  stock = excluded.stock;
