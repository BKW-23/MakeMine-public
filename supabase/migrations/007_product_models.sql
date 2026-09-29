alter table public.products
  add column if not exists model_url text not null default '';

update public.products
set model_url = '/models/guong-cam-tay-lap-lanh.glb'
where slug = 'guong-cam-tay-lap-lanh'
  and model_url = '';