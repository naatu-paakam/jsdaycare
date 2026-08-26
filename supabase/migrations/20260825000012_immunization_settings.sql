alter table students add column if not exists immunization_settings jsonb default '["Hep B","DTaP","Hib","PCV","Polio","Rotavirus","Covid","Flu","MMR","VAR","Hep A"]'::jsonb;
